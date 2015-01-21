var MongoClient = require('mongodb').MongoClient;


var express = require('express')
  , http = require('http');

var app = express();

app.use('/room/',  express.static(__dirname + '/'));
app.configure(function(){
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(app.router);
});



var db;
var server;
var io;
// Initialize connection once
MongoClient.connect("mongodb://127.0.0.1:27017/multichat", function(err, database) {
  if(err) {
   console.log("error");
   throw err;
  }

  db = database;
});
 
app.get('/room/:name', function (req, res) {  
  res.sendfile(__dirname + '/index.html');  
});

// M.Buffa. Rappel des trois syntaxes de socket.io
// socket = un tuyau relié à un client. C'est un objet unique par client.
//      Donc si on fait socket.n = 3; c'est comme si on ajoutait une propriété
// 		"n" à la session dédiée au client connecté. 
// socket.emit(type_message, data) = envoie un message juste au client connecté
// socket.broadcast.emit(type_message, data1, data2) = envoie à tous les clients
// 		sauf au client connecté
// io.sockets.emit(type_message, data1, data2) = envoie à tous les clients y compris
// 		au client connecté.
// 	Variantes avec les "room" :
// 	socket.broadcast.to(nom de la salle).emit(...) = tous sauf client courant, mais
// 													 de la salle
// io.sockets.in(nom de la salle).emit(...) = tous les clients de la salle y compris
// 											  le client courant.
//deleteAll("user");
//deleteAll("message");
var nbClientMax = 4;
server = app.listen(2013);
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket){

	// Permet d'envoyer des traces au client distant
	function log(){
		var array = [">>> "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		log('Got message: ', message);
		socket.broadcast.emit('message', message); // should be room only
	});

	socket.on('create or join', function (room) {
		var numClients = io.sockets.clients(room).length;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', room);

		if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
			insertRoom(room);
			socket.room = room;
		} else if (numClients < nbClientMax) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.room = room;
			socket.emit('joined', room);
		} else { // max nbClientMax clients
			socket.emit('full', room);
		}
		//socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		//socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
		//insertMessage("user1", room, "ISODate(\"2014-02-10T10:50:42.389Z\")", "blablabla");
		//insertRoom(room);
		//get("room");
      //insertUser("bob", room);
      //get("room");
	});

   // when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(room, username){
	   log("in adduser " + username + " " + room);
	   socket.username = username;
	   insertUser(username, room);
	   // echo to room 1 that a person has connected to their room
	   var text = username + ' has connected to this room';
	   socket.broadcast.to(room).emit('updatechat', 'SERVER', text);
      var date = new Date(Date.now());
      insertMessage(username, room, date, text);
	});
	
	socket.on('getusers', function(room){
	   var users = getUsers(room);
	   socket.emit('');
	});
	
	socket.on('sendMsg', function(username, room, text){
	   // echo to room 1 the message of username
		socket.broadcast.to(room).emit('updatechat', username, text);
	   var date = new Date(Date.now());
      insertMessage(username, room, date, text);
	});
});

function insertMessage(user, room, date, text) {
   var newMsg = {
      date : date,
      sender : user,
      text : text,
      room_id : room
   };
   insert('message', newMsg);
}

function insertRoom(room) {
   var newRoom = {
      _id : room,
      name : room
   };
   insert('room', newRoom);
}

function insertUser(user, room) {
   var newUser = {
        name : user,
        room_id : room
   };
   insert('user', newUser);
}

function insert(collection, document) {
   var collection = db.collection("\""+collection+"\"");
   collection.insert(document);
}

function deleteUser(userId) {
   var collection = db.collection("\""+collection+"\"");
   collection.remove({_id : userId});
}

function deleteAll(collection) {
   var collection = db.collection("\""+collection+"\"");
   collection.remove({});
}

function getUsers(room) {
}

function get(collection) {
   var collection = db.collection("\""+collection+"\"");
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
      /*res.type('text/plain');
      res.send(users);
      db.close();
      */
   });
}

