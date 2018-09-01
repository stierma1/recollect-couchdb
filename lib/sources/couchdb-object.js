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

module.exports = class CouchDbSource {
    constructor(params, rawDocs) {
        if (!params.connectionInfo) {
            throw new Error("ConnectionInfo must be defined");
        }

        if (!params._id) {
            throw new Error("_id must be defined");
        }

        this.connectionInfo = JSON.parse(params.connectionInfo);
        this.docs = rawDocs || [];
        this.complete = false;
        this._id = params._id;
    }

    async init() {

    }

    async nextPage() {

      if (this.complete) {
          return [];
      }
      this.complete = true;
      var {protocol, username, password, hostName, dbName} = this.connectionInfo;

      return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${this._id}?include_docs=true`})
        .then((edoc) => {

          var {data, error, reason} = JSON.parse(edoc);
          if(error){
            throw new Error(error + " " + reason);
          }

          return data;
        });
    }
}
