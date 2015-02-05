var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb')
var serverMongo = new mongodb.Server('127.0.0.1', 27017, {auto_reconnect: true});
var db = new mongodb.Db('multichat', serverMongo);
db.open(function(){});

verifyBan = function(req, res) {
   var collection = db.collection("room");
   var doc = collection.findOne({_id:req.params.name}, {_id:0, passPrivate:1, bannedIP:1},function(err, item) {
      if (item != null) {
         var bannedIP = JSON.stringify(item.bannedIP);
         if (bannedIP != undefined && bannedIP.indexOf(req.socket.localAddress) == 1) {
         //if (bannedIP.indexOf(req.socket.localAddress) == 1) {
            res.send("You are banned");
         } else {
            if (item.passPrivate == "") {
               res.sendfile(__dirname + '/logRoom.html');
            } else {
               res.sendfile(__dirname + '/logPrivateRoom.html');  
            }
         }
      } else {
         res.sendfile(__dirname + '/newRoom.html');  
      }
  });
}

module.exports.setOnMethods = function(socket, io) {
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
         var history = JSON.stringify(results);
         socket.emit('fullHistory', history);
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

   insertRoom = function (room, passAdmin, passPrivate) {
      var newRoom = {
         _id : room,
         name : room,
         passAdmin : passAdmin,
         passPrivate : passPrivate,
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

   /*insertUser = function (user, room) {
      var newUser = {
           name : user,
           room_id : room
      };
      insert('user', newUser);
   },*/

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
      console.log("addBannedIP");
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
            //Leave the room
            disconnect();
         }
     });
   }
   
   joinOrReject = function(room, passPrivate) {
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, {_id:0, passPrivate:1}, function(err, item) {
         if (item.passPrivate == passPrivate) {
            io.sockets.in(room).emit('join', room);
			   socket.join(room);
			   socket.room = room;
			   socket.emit('joined', room);
         } else {
            socket.emit('wrongPass', room);
         }
     });
   }
   
   disconnect = function() {
      // remove the username from global usernames list
      //delete usernames[socket.username];
      // update list of users in chat, client-side
      //io.sockets.in(nom de la salle).emit('updateusers', usernames)
      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
   }
   
   insertFile = function (room, fileName, originName, owner, date) {
      var newFile = {
           filename : fileName,
           room_id : room,
           originName : originName,
           owner : owner,
           date : date,
      };
      insert('file', newFile);
   }
   
   getFile = function (room, filename) {
      var collection = db.collection("file");
      var result = collection.find({room_id:room, filename:filename}, {_id:0, room_id:0}).sort({date:1});
      result.toArray(function (err, results) {
         if (err) {
            throw err;
         }
         if (results.length === 0) {
            console.log('Error 404: No log found');
         }
         //socket.emit('fullHistory', JSON.stringify(results));
      });
   }
   
   download = function(foldername, filename, res){
      if (socket.room == foldername) {
         res.download(__dirname + '/files/'+foldername+'/'+filename);
      } else {
         res.send("You are not in the room");
      }
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
