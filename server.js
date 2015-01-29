var express = require('express');
var http = require('http');
var app = express();

app.use('/room/',  express.static(__dirname + '/'));
app.configure(function(){
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(app.router);
});

var server;
var io;
 
app.get('/room/:name', function (req, res) {  
  res.sendfile(__dirname + '/index.html');  
});
app.get('/privateroom/:name', function (req, res) {  
  res.sendfile(__dirname + '/index.html');  
});

var nbClientMax = 5;
server = app.listen(2013);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket){
   var mongo = require('./mongo.js').setOnMethods(socket);
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
      var ipClient = socket.handshake.address;
      //console.log("ipClient " + ipClient);
		if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
			socket.room = room;
			insertRoom(room, ipClient);
			//console.log("is creator " + isCreator(socket.room, socket.handshake.address));
			/*if (isCreator(socket.room, socket.handshake.address)) {
	         addBannedIP(socket.room, ipClient);
	      }
			console.log("isbanned " + isBanned(room, ipClient))*/
			
		} else if (numClients < nbClientMax && !isBanned(room, ipClient)) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.room = room;
			socket.emit('joined', room);
		} else { // max nbClientMax clients
			socket.emit('full', room);
		}
	});
	
	socket.on('set pass room', function (room, pass) {
		setPass(room, pass);
	});

   // when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(room, username){
	   socket.username = username;
	   insertUser(username, room);
	   // echo to room 1 that a person has connected to their room
	   var text = username + ' has connected to this room';
	   //socket.broadcast.to(room).emit('updatechat', 'SERVER', text);
      var date = new Date(Date.now());
      insertMessage(username, room, date, text);
	});
	
	socket.on('newMessage', function(text){
	   // echo to room 1 the message of username
		io.sockets.in(socket.room).emit('updatechat', socket.username, text);
	   var date = new Date(Date.now());
      insertMessage(socket.username, socket.room, date, text);
	});
	
	socket.on('newLog', function(text){
	   // echo to room 1 the message of username
		io.sockets.in(socket.room).emit('updateHistory', text);
	   var date = new Date(Date.now());
      insertLog(socket.room, date, text);
	});
	
	socket.on('getFullHistory', function(){
	   // emit the history of the room to the client connected
	   getLog(socket.room);
		//socket.emit('fullHistory', data);
	});
	
	socket.on('banIP', function(ip){
	   // add banned ip to db
	   if (isCreator(socket.room, socket.handshake.address)) {
	      addBannedIP(socket.room, ip);
	   }
	});
});

