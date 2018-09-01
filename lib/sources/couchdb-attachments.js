var utils = require("../utils");

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
        this.params = params;
    }

    async init() {

    }

    async nextPage() {
      if (this.complete) {
          return [];
      }

      this.complete = true;

      return utils.getAttachments(this.params, this.connectionInfo)
    }
}
