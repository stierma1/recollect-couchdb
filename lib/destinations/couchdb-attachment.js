
var utils = require("../utils");

module.exports = class CouchDBAttachment{
    constructor(params){
      this.params = params;
      if(!params.connectionInfo){
        throw new Error("Connection Info must be defined")
      }
      this.connectionInfo = JSON.parse(params.connectionInfo);
    }

    async send({headers, renderPipe}){
      return utils.overwriteMetaAttachment(this.params, this.connectionInfo, headers, renderPipe);
    }
  }
