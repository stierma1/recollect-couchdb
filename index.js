var {RecollectBuilder} = require("recollect-data");
var SearchableConnection  = require("./lib/searchable-connection");
var CouchDbObjectClosure = require("./lib/destinations/couchdb-object");
var CouchDbObjectsClosure = require("./lib/destinations/couchdb-objects");
var CouchDBAttachmentDestination = require("./lib/destinations/couchdb-attachment");
var CouchDbOverwriteObjectClosure = require("./lib/destinations/couchdb-overwrite-object");
var CouchDbOverwriteObjectsClosure = require("./lib/destinations/couchdb-overwrite-objects");
var CouchDbSourceObjects = require("./lib/sources/couchdb-objects");
var CouchDbSourceObject = require("./lib/sources/couchdb-object");
var CouchDbSourceAttachments = require("./lib/sources/couchdb-attachments");
var request = require("request");
var utils = require("./lib/utils");

var connectionInfo = {
  protocol:"https",
  username:"fakeuse",
  password:"fakepass",
  hostName:"my.domain.com",
  dbName:"recollect-test"
}

module.exports = function load(searchableConnectionInfo){
  RecollectBuilder.addSearchableConnection(new SearchableConnection(searchableConnectionInfo, request));
  RecollectBuilder.addConstructor("CouchDbObject", CouchDbObjectClosure)
    .addConstructor("CouchDbObjects", CouchDbObjectsClosure)
    .addConstructor("CouchDBAttachmentDestination", CouchDBAttachmentDestination)
    .addConstructor("CouchDbOverwriteObject", CouchDbOverwriteObjectClosure)
    .addConstructor("CouchDbOverwriteObjects", CouchDbOverwriteObjectsClosure)
    .addConstructor("CouchDbSourceObjects", CouchDbSourceObjects)
    .addConstructor("CouchDbSourceObject", CouchDbSourceObject)
    .addConstructor("CouchDbSourceAttachments", CouchDbSourceAttachments)
}
