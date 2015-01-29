var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb')
var serverMongo = new mongodb.Server('127.0.0.1', 27017, {auto_reconnect: true});
var db = new mongodb.Db('multichat', serverMongo);
db.open(function(){});

verifyBan = function(req, res) {
   var collection = db.collection("room");
   var doc = collection.findOne({_id:req.params.name}, {_id:0, bannedIP:1},function(err, item) {
      if (item != null) {
         var bannedIP = JSON.stringify(item.bannedIP);
         if (bannedIP != undefined && bannedIP.indexOf(req.socket.localAddress)) {
            res.send("You are banned");
         } else {
            res.sendfile(__dirname + '/index.html');  
         }
      } else {
         res.sendfile(__dirname + '/index.html');  
      }
  });
}   

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

   insertRoom = function (room, ipCreator) {
      var newRoom = {
         _id : room,
         name : room,
         creator : ipCreator,
         bannedIP : [],
      };
      insert('room', newRoom);
   },
   
   insertPrivateRoom = function (room, pass) {
      var newRoom = {
         _id : room,
         pass : pass,
         name : room,
         bannedIP : [],
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
   
   setPass = function (room, pass) {
      var collection = db.collection("room");
      collection.update({name:room},{$set:{pass:pass}})
      get("room");
   },
   
   addBannedIP = function(room, ip) {
      var collection = db.collection("room");
      collection.update({_id:room}, {$push:{bannedIP:ip}})
   }
   
   isBanned = function(room, ip) {
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, {_id:0, bannedIP:1},function(err, item) {
         if (item.bannedIP.contains(ip)) {
            console.log("ip on array");
            //Is banned;
         }
         console.log("return false");
         //Is not banned;
     });
   }
   
   banIP = function(room, ipCreator, ipToBan) {
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, function(err, item) {
         if (item.creator == ipCreator) {
            addBannedIP(socket.room, ipToBan);
         }
     });
   }
   
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
