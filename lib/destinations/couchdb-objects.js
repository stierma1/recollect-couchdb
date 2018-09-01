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

module.exports = class CouchDbObjects{
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
      var {protocol, username, password, hostName, dbName} = this.connectionInfo;
      return this.toObject(headers, renderPipe)
        .then((obj) => {
          var proms = [];
          for(let i in obj){
            proms.push(promisifyRequest({method:"post", url:`${protocol}://${username}:${password}@${hostName}/${dbName}`, json:obj[i]}))
          }
          return Promise.all(proms);
        });
    }
  }
