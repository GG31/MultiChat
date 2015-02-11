var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb')
var serverMongo = new mongodb.Server('127.0.0.1', 27017, {auto_reconnect: true});
var db = new mongodb.Db('multichat', serverMongo);
db.open(function(){});
verifyBan = function(req, res) {
   var collection = db.collection("room");
   var doc = collection.findOne({_id:req.params.name}, {_id:0, passPrivate:1, bannedIP:1},function(err, item) {
      console.log("IP : " + req.connection.remoteAddress);
      if (item != null) {
         var bannedIP = JSON.stringify(item.bannedIP);
         if (bannedIP != undefined && bannedIP.indexOf(req.connection.remoteAddress) == 1) {
            res.send("You are banned");
         } else {
               res.sendfile(__dirname + '/index.html');
         }
      } else {
         res.sendfile(__dirname + '/index.html');  
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

   insertUser = function (user, ip, room) {
      var newUser = {
           name : user,
           ip : ip,
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
      //console.log("addBannedIP");
      collection.update({_id:room}, {$push:{bannedIP:ip}})
   }
   
   banIP = function(room, usernameToBan, passAdmin) {
      console.log('on banIP ' + room + ' ' + usernameToBan + ' ' + passAdmin);
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, function(err, item) {
         console.log('passAdmin ' + item.passAdmin + '=?=' + passAdmin);
         if (item.passAdmin == passAdmin) {
            var collectionUser = db.collection("user");
            var docUser = collectionUser.findOne({name:usernameToBan, room_id:room}, function(err, item) {
               console.log('find user to ban ' + item.ip);
               addBannedIP(socket.room, item.ip);
               //Ask who is the user with item.ip
               io.sockets.in(room).emit('amITheUser', item.ip);
            });
         }
     });
   }
   
   isUnique = function(username, room, balise) {
      console.log('user ' + username + ' room ' + room);
      var collection = db.collection("user");
      var doc = collection.find({room_id:room});
      doc.toArray(function(err, item) {
         var returnValue = true;
         for(i=0; i<item.length; i++) {
            if(item[i].name == username){ 
               returnValue = false;
            }
         }
         socket.emit('isUnique', returnValue, balise);
     });
   }
   
   joinOrReject = function(room, passPrivate) {
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, {_id:0, passPrivate:1}, function(err, item) {
         console.log(item.passPrivate + " =?= " + passPrivate);
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
   
   getFiles = function (room) {
      var collection = db.collection("file");
      var result = collection.find({room_id:room}, {_id:0, room_id:0});
      result.toArray(function (err, results) {
         if (err) {
            throw err;
         }
         if (results.length === 0) {
            console.log('Error 404: No log found');
         }
         socket.emit('fullFiles', JSON.stringify(results));
      });
   }
   
   download = function(foldername, filename, res){
      if (socket.room == foldername) {
         res.download(__dirname + '/files/'+foldername+'/'+filename);
      } else {
         res.send("You are not in the room");
      }
   },
   
   typePage = function(room) {
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, {_id:0, passPrivate:1, bannedIP:1},function(err, item) {
         if (item != null) {
            if (item.passPrivate == "") {
               socket.emit('typePage', "containerLogRoom");
            } else {
               socket.emit('typePage', "containerLogPrivateRoom"); 
            }
         } else {
            socket.emit('typePage', "containerNewRoom");
         }
     });
   }
   
   deleteUser = function (username, room) {
      var collection = db.collection('user');
      collection.remove({name : username, room_id:room});
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
