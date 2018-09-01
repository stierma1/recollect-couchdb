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

        this.connectionInfo = JSON.parse(params.connectionInfo);
        this.docs = rawDocs || [];
        this.complete = false;
        this.skip = parseInt(params.skip) || 0;
        this.limit = parseInt(params.limit) || 1;
        this.initialized = false;
    }

    async init() {
      this.initialized = true;
      var {protocol, username, password, hostName, dbName} = this.connectionInfo;
      var edoc = await promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/_all_docs?include_docs=false`})
      var {total_rows} = JSON.parse(edoc);

      if(total_rows === undefined){
        throw new Error("No Database found " + dbName)
      }
      this.totalDocs = total_rows;

    }

    async nextPage() {
      if(!this.initialized){
        await this.init();
      }

      if (this.complete) {
          return [];
      }

      var {protocol, username, password, hostName, dbName} = this.connectionInfo;

      return promisifyRequest({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/_all_docs?skip=${this.skip}&limit=${this.limit}&include_docs=true`})
        .then((edoc) => {
          var {total_rows, rows, offset} = JSON.parse(edoc);
          this.skip = offset + rows.length;

          if(this.skip >= this.totalDocs){
            this.complete = true;
          }

          this.docs = rows.map((row) => {
            return row.doc
          });

          return this.docs;
        });
    }
}
