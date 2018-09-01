var {globalClassPath, SearchableClass} = require("classpath");
var {Functions} = require("recollect-data");

class SearchableConnection extends SearchableClass{
  constructor(connectionInfo, request){
    super("SearchableConnection");
    this.connectionInfo = connectionInfo;
    this.request = request;
  }

  async search(pattern){
    var type = pattern.split(":")[0].replace("#", "");
    var name = pattern.split(":")[1].replace(/\*$/, "");

    return [{document: await this.getFunction(type, name)}];
  }

  async getFunction(type, name){
    var couchDoc = await this.makeRequest(type, name);
    var funcDoc = this.processFunctionString(type, couchDoc.function);

    for(var i in Functions){
      if(i.toLowerCase() === type){
        return new Functions[i](name, funcDoc);
      }
    }
  }

  makeRequest(type, name){
    var {protocol, username, password, hostName, dbName} = this.connectionInfo;
    return new Promise((res, rej) => {
      this.request({method:"get", url:`${protocol}://${username}:${password}@${hostName}/${dbName}/${type + ":" + name}`}, (err, resp, body) => {
        if(err){
          return rej(err);
        }
        var b = JSON.parse(body);
        if(b.error === "not_found"){
          return rej(new Error("Function not found: " + type + ":" + name));
        }
        res(b);
      })
    });
  }

  processFunctionString(type, functionString){
    if(type === "composite"){
      return functionString;
    }
    var func = null;
    eval("func = " + functionString);
    return func;
  }
}

module.exports = SearchableConnection;
