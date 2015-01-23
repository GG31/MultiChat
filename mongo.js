var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb')
var serverMongo = new mongodb.Server('127.0.0.1', 27017, {auto_reconnect: true});
var db = new mongodb.Db('multichat', serverMongo);
db.open(function(){});

module.exports.setOnMethods = function(socket) {
   getLog = function (room) {
      var collection = db.collection("log");
      var result = collection.find({room_id:room}, {_id:0, room_id:0}).sort({date:1});
      result.toArray(function (err, results) {
         if (err) {
            throw err;
         }
         if (results.length === 0) {
            console.log('Error 404: No log found');
         }
         socket.emit('fullHistory', JSON.stringify(results));
      });
   },
      
   insertLog = function(room, date, text) {
      var newLog = {
         date : date,
         text : text,
         room_id : room
      };
      insert('log', newLog);
   },

   insertMessage = function (user, room, date, text) {
      var newMsg = {
         date : date,
         sender : user,
         text : text,
         room_id : room
      };
      insert('message', newMsg);
   },

   insertRoom = function (room) {
      var newRoom = {
         _id : room,
         name : room
      };
      insert('room', newRoom);
   },

   insertUser = function (user, room) {
      var newUser = {
           name : user,
           room_id : room
      };
      insert('user', newUser);
   },

   insert = function (collection, document) {
      var collection = db.collection(collection);
      collection.insert(document);
   },

   deleteUser = function (userId) {
      var collection = db.collection(collection);
      collection.remove({_id : userId});
   },

   deleteAll = function (collection) {
      var collection = db.collection(collection);
      collection.remove({});
   },

   get = function (collection) {
      var collection = db.collection(collection);
      var result = collection.find();
      result.toArray(function (err, results) {
         if (err) {
            throw err;
         }
         if (results.length === 0) {
            //res.statusCode = 404;
            //return res.send('Error 404: No users found');
            console.log('Error 404: No users found');
         }
         var users = JSON.stringify(results);
         console.log('plop ' + users);
      });
   }

}
