var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb')
var serverMongo = new mongodb.Server('127.0.0.1', 27017, {auto_reconnect: true});
var db = new mongodb.Db('multichat', serverMongo);
db.open(function(){});
var nbClientMax = 5;

// Renvoie "You are banned" si le client tente de se connecter à une room dont il est banni, l'index sinon
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
   // Renvoie la liste des logs de la room
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
      
   // Insère un log dans la base de données
   insertLog = function(room, date, text) {
      var newLog = {
         date : date,
         text : text,
         room_id : room
      };
      insert('log', newLog);
   },

   // Insère un message dans la base de données
   insertMessage = function (user, room, date, text) {
      var newMsg = {
         date : date,
         sender : user,
         text : text,
         room_id : room
      };
      insert('message', newMsg);
   },

   // Insère une nouvelle room dans la base de données
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

   // Insère un utilisateur dans la base de données
   insertUser = function (user, ip, room) {
      var newUser = {
           name : user,
           ip : ip,
           room_id : room
      };
      insert('user', newUser);
   },

   // Insertion d'un document dans la collection
   insert = function (collection, document) {
      var collection = db.collection(collection);
      collection.insert(document);
   },
   
   // Ajoute l'IP d'un utilisateur banni
   addBannedIP = function(room, ip) {
      var collection = db.collection("room");
      //console.log("addBannedIP");
      collection.update({_id:room}, {$push:{bannedIP:ip}})
   }
   
   // Vérifie le mot de passe et ajoute l'ip à la liste des bannis
   banIP = function(room, usernameToBan, passAdmin) {
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, function(err, item) {
         if (item.passAdmin == passAdmin) {
            var collectionUser = db.collection("user");
            var docUser = collectionUser.findOne({name:usernameToBan, room_id:room}, function(err, item) {
               addBannedIP(socket.room, item.ip);
               //Ask who is the user with item.ip
               io.sockets.in(room).emit('amITheUser', item.ip);
            });
         }
     });
   }
   
   // Controle si le username est unique dans la room
   isUnique = function(username, room, balise) {
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
   
   // Vérifie le mot de passe et envoie le signal de la décision
   createJoinOrReject = function(room, passPrivate, numClients) {
      var collection = db.collection("room");
      var doc = collection.findOne({_id:room}, {_id:0, passPrivate:1}, function(err, item) {
         if (item.passPrivate == passPrivate) {
			   if (numClients == 0) {  
			      io.sockets.in(room).emit('join', room);
			      socket.join(room);
			      socket.room = room;
			      socket.emit('created', room);
			   } else if (numClients < nbClientMax){
			      io.sockets.in(room).emit('join', room);
			      socket.join(room);
			      socket.room = room;
			      socket.emit('joined', room);
			   } else {
			      deleteUser(socket.username, room);
			      socket.emit('full', room);
			   }
         } else {
            deleteUser(socket.username, room);
            socket.emit('wrongPass', room);
         }
     });
   }

   // Insère un fichier dans la base de données
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
   
   // Renvoie la liste des fichiers de la room
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
   
   // Download le fichier situé dans files/foldername/filename
   download = function(foldername, filename, res){
      if (socket.room == foldername) {
         res.download(__dirname + '/files/'+foldername+'/'+filename);
      } else {
         res.send("You are not in the room");
      }
   },
   
   // Renvoie le type de page suivant le cas, room existante, public, privée
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
   
   // Supprime username de la room de la base de données
   deleteUser = function (username, room) {
      var collection = db.collection('user');
      collection.remove({name : username, room_id:room});
   }
}
