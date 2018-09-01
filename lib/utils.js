var request = require("request");

var promisifyRequest = (httpInfo) => {
  return new Promise((res, rej) => {
    request(httpInfo, (err, resp, body) => {
      if(err){
        return rej(err);
      }
      if(body && body.error){
        return rej(new Error(body.error));
      }
      return res(body);
    })
  })
}

function promisifyPipe(httpInfo, pipe){
  return new Promise((res, rej) => {
    var next = pipe.pipe(request(httpInfo));
    next.once("end", () => {
      return res();
    });

    next.once("error", () => {
      return rej(new Error("error occurend in streaming: " + httpInfo.url));
    })
  })
}

function getRev(params, connectionInfo){
  if(!params || !params._id){
    throw new Error("_id is undefined");
  }

  var {protocol, username, password, hostName, dbName} = connectionInfo;

  return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${params._id}`})
    .then((doc) => {
      var _rev = undefined;
      if(doc){
        _rev = JSON.parse(doc)._rev;
      }
      return _rev;
    });
}

function getAttachmentNames(params, connectionInfo){
  return getDoc(params, connectionInfo)
    .then((doc) => {
      return Object.keys(doc._attachments || {});
    })
}



function getDoc(params, connectionInfo){
  if(!params || !params._id){
    throw new Error("_id is undefined");
  }

  var {protocol, username, password, hostName, dbName} = connectionInfo;

  return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${params._id}`})
    .then((doc) => {
      if(doc){
        return JSON.parse(doc);
      }
      throw new Error("No response from db: " + dbName);
    });
}

async function getAttachments(params, connectionInfo){
  var {protocol, username, password, hostName, dbName} = connectionInfo;

  var doc = await getDoc(params, connectionInfo);
  var attachmentInfos = [];
  for(var i in doc._attachments){
    attachmentInfos.push([i, doc._attachments[i].content_type]);
  }

  return Promise.all(attachmentInfos.map((info) => {
    let [name, contentType] = info;
    return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${params._id}/${name}`})
      .then((body) => {
        return [name, contentType, body, doc.meta];
      })
  }));

}

function overwriteObject(params, connectionInfo, headers, obj){
  if(!params || !params._id){
    throw new Error("_id is undefined");
  }

  var {protocol, username, password, hostName, dbName} = connectionInfo;

  return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${params._id}`})
    .then((doc) => {
      var _rev = undefined;
      if(doc){
        _rev = JSON.parse(doc)._rev;
      }

      return promisifyRequest({method:"post", url:`${protocol}://${username}:${password}@${hostName}/${dbName}`, json:{_id:params._id, _rev, data:obj}});
    });
}

function overwriteObjectWithMeta(params, connectionInfo, headers, obj){
  if(!params || !params._id){
    throw new Error("_id is undefined");
  }

  var {protocol, username, password, hostName, dbName} = connectionInfo;

  return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${params._id}`})
    .then((doc) => {
      var _rev = undefined;
      if(doc){
        _rev = JSON.parse(doc)._rev;
      }
      return promisifyRequest({method:"post", url:`${protocol}://${username}:${password}@${hostName}/${dbName}`, json:{_id:params._id, _rev, meta: headers && headers.meta, data:obj}});
    });
}

function overwriteMetaAttachment(params, connectionInfo, headers, pipe){
  if(!params || !params.attachmentName){
    throw new Error("attachmentName is undefined");
  }

  var contentType = headers["Content-Type"] || headers["content-type"];
  var {protocol, username, password, hostName, dbName} = connectionInfo;

  return overwriteObjectWithMeta(params, connectionInfo, headers)
    .then(() => {
      return getRev(params, connectionInfo)
    })
    .then((rev) => {
      return promisifyPipe({
        method:"put",
        url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${params._id}/${params.attachmentName}?rev=${rev}`,
        headers:{"content-type":contentType}
      }, pipe)
    })
}

module.exports = {getDoc, getRev, getAttachmentNames, getAttachments, overwriteObjectWithMeta, overwriteObject, overwriteMetaAttachment, promisifyPipe, promisifyRequest};
