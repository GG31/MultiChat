var express = require('express');
var http = require('http');
var app = express();

//app.use('/room/',  express.static(__dirname + '/'));
app.use('/',  express.static(__dirname + '/'));
app.configure(function(){
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(app.router);
});
app.enable('trust proxy');

var server;
var io;
var mongo = require('./mongo.js');
var fileTranfert = require('./fileTransfert.js');


server = app.listen(8080);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket){
   mongo.setOnMethods(socket, io);
   fileTranfert.setOnMethods(socket, io);
	// Permet d'envoyer des traces au client distant
	function log(){
		var array = [">>> "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}
    
    socket.on('messageForRoom', function (message) {
		log('Got message: ', message);
		socket.broadcast.to(socket.room).emit('message',message);
	});
	
	//Création d'un nouvelle room
	socket.on('createRoom', function (room, passAdmin, passPrivate) {
		insertRoom(room, passAdmin, passPrivate);	
		socket.room = room;
	});

   //Demande de join à la room room
	socket.on('create or join', function (room, passAdmin, passPrivate) {
		var numClients = io.sockets.clients(room).length;
	   createJoinOrReject(room, passPrivate, numClients);
	});

   // Add a user
	socket.on('adduser', function(room, username, ip){
	   socket.username = username;
	   insertUser(username, ip, room);
	   // echo to room 1 that a person has connected to their room
	   var text = username + ' has connected to this room';
      var date = new Date(Date.now());
      insertMessage(username, room, date, text);
	});
	
	// Verify if username is unique in the room
	socket.on('isUniqueName', function(username, room, balise) {
	   isUnique(username, room, balise);
	});
	
	// Un nouveau message de chat est envoyé à la room 
	socket.on('newMessage', function(text){
	   // echo to room 1 the message of username
		io.sockets.in(socket.room).emit('updatechat', socket.username, text);
	   var date = new Date(Date.now());
      insertMessage(socket.username, socket.room, date, text);
	});
	
	// Message de connexion envoyé à toute la room
	socket.on('newMessageConnexion', function(text){
	   // echo to room 1 the message of username
		io.sockets.in(socket.room).emit('updateChatConnexion', socket.username, text);
	});
	
	// Nouveau log dans l'historique
	socket.on('newLog', function(text){
	   // echo to room 1 the message of username
	   io.sockets.in(socket.room).emit('updateHistory', text);
	   var date = new Date(Date.now());
      insertLog(socket.room, date, text);
	});
	
	// Renvoie l'historique de la room
	socket.on('getFullHistory', function(){
	   // emit the history of the room to the client connected
	   getLog(socket.room);
	});
	
	// Renvoie la liste des files de la room
	socket.on('getFullFiles', function(){
	   // emit the files of the room to the client connected
	   getFiles(socket.room);
	});
	
	// Bannit l'IP du username si le mot de passe est correct
	socket.on('banIP', function(username, passAdmin){
	   // add banned ip to db if the creator emit banIP
	   banIP(socket.room, username, passAdmin);
	});
	
	// Si est appelé alors déconnecter le client
	socket.on('iAmTheUser', function(){
	   deleteUser(socket.username, socket.room);
	   socket.leave(socket.room);
	});
	
	// Renvoie le type de page, logRoom si la room demandé est public, logPrivateRoom, si privée, newRoom si elle n'existe pas.
	socket.on('typePage', function(room){
	   typePage(room);
	});
	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
	   deleteUser(socket.username, socket.room);
		io.sockets.in(socket.room).emit('updateDisconnect', socket.username, socket.room);
		socket.leave(socket.room);
	});
	
});

app.get('/:name', function (req, res) {  
   verifyBan(req, res);
});

app.get('/download/:name/:filename', function (req, res) {
   download(req.params.name, req.params.filename, res);  
});

