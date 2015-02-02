var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');

//app.use('/room/',  express.static(__dirname + '/'));
app.use('/',  express.static(__dirname + '/'));
app.configure(function(){
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.bodyParser({uploadDir:'./uploads'}));
  app.use(bodyParser.urlencoded());//
  app.use(bodyParser.json());//
});

var server;
var io;
var mongo = require('./mongo.js');
var fileTranfert = require('./fileTransfert.js');

var nbClientMax = 5;
server = app.listen(2013);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket){
   mongo.setOnMethods(socket);
   fileTranfert.setOnMethods(socket);
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
		if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
			socket.room = room;
			console.log("room " + socket.room);
			insertRoom(room, ipClient.address);	
		} else if (numClients < nbClientMax) {/*TODO Verify ipClient is not banned*/
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
	   // add banned ip to db if the creator emit banIP
	   //banIP(socket.room, socket.handshake.address.address, "127.0.0.1");
	   banIP(socket.room, socket.handshake.address.address, ip);
	});
	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		disconnect();
	});
});
/*
app.get('/room/:name', function (req, res) {  
  //verifyBan(req, res);
  res.sendfile(__dirname + '/index.html');
});

app.get('/privateroom/:name', function (req, res) {  
  res.sendfile(__dirname + '/index.html');  
});
*/

app.get('/:name', function (req, res) {  
  //verifyBan(req, res);
  res.sendfile(__dirname + '/index.html');
});

