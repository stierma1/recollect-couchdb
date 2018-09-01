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

module.exports = class CouchDbOverwriteObject{
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
      if(!this.params || !this.params._id){
        throw new Error("_id is undefined");
      }
      var {protocol, username, password, hostName, dbName} = this.connectionInfo;
      return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${this.params._id}`})
        .then((doc) => {
          var _rev = undefined;
          if(doc){
            _rev = JSON.parse(doc)._rev;
          }
          return this.toObject(headers, renderPipe)
            .then((obj) => {
              return promisifyRequest({method:"post", url:`${protocol}://${username}:${password}@${hostName}/${dbName}`, json:{_id:this.params._id, _rev, data:obj}});
            });
        });
    }
  }
