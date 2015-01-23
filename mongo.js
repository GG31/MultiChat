var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

Provider = function(host, port) {
  this.db= new Db('node-mongo-blog', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

Provider.prototype.getCollection= function(callback) {
  this.db.collection('log', function(error, article_collection) {
    if( error ) callback(error);
    else callback(null, article_collection);
  });
};

exports.Provider = Provider;
