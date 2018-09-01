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

module.exports = class CouchDbOverwriteObjects{
    constructor(params){
      this.params = params;
      if(!params.connectionInfo){
        throw new Error("Connection Info must be defined")
      }
      this.connectionInfo = JSON.parse(params.connectionInfo);
    }

    async toObject(headers, renderPipe){
      return new Promise((res, rej) => {
        var bufferStr = "";
        var buffer = Buffer.from("", "utf8");

        renderPipe.on("data", (d) => {
          bufferStr += d.toString("utf8");
          buffer = Buffer.concat([buffer, d], buffer.length + d.length);
        });

        renderPipe.on("end", () => {
          var contentType = headers["Content-Type"] || headers["content-type"] || "";
          if(contentType === "application/json"){
            return res(JSON.parse(bufferStr));
          }
          if(contentType.indexOf("text/") > -1){
            return res(bufferStr);
          }
          res(buffer);
        });
      });
    }

    async send({headers, renderPipe}){
      return this.toObject(headers, renderPipe)
        .then((obj) => {
          var proms = [];
          for(let i in obj){
            proms.push(this.overwriteDoc(obj[i]))
          }
          return Promise.all(proms);
        });

      return
    }

    async overwriteDoc(doc){
      var id = doc._id;
      var {protocol, username, password, hostName, dbName} = this.connectionInfo;
      return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${id}`})
        .then((edoc) => {
          var _rev = undefined;
          if(edoc){
            _rev = JSON.parse(edoc)._rev;
          }
          doc._rev = _rev;
          return promisifyRequest({method:"post", url:`${protocol}://${username}:${password}@${hostName}/${dbName}`, json:doc});
        });
    }

  }
