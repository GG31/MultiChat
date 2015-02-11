/*var express = require('express');
var http = require('http');
var app = express();*/

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(8080);

app.use('/',  express.static(__dirname + '/'));
app.configure(function(){
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', "http://"+req.headers.host+':8080');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, X-Requested-With,origin, content-type, accept');
      res.setHeader('Access-Control-Expose-Headers', 'X-My-Custom-Header, X-Another-Custom-Header');
      res.setHeader('Access-Control-Max-Age', 1728000);
      res.setHeader('Access-Control-Allow-Credentials', true);
      next();
   }
   );
});
app.enable('trust proxy');


var mongo = require('./mongo.js');
var fileTranfert = require('./fileTransfert.js');

var nbClientMax = 5;
/*var server;
var io;
server = app.listen(8080);
var io = require('socket.io').listen(server);
*/
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

	socket.on('message', function (message) {
		log('Got message: ', message);
		socket.broadcast.emit('message', message); // should be room only
	});
	
	socket.on('createRoom', function (room, passAdmin, passPrivate) {
		insertRoom(room, passAdmin, passPrivate);	
		socket.room = room;
	});

	socket.on('create or join', function (room, passAdmin, passPrivate) {
		var numClients = io.sockets.clients(room).length;
      var ipClient = socket.handshake.address;
		if (numClients == 0){ //TODO vérifier le mot de passe si jamais la room s'est vidée entre temps
			socket.join(room);
			socket.emit('created', room);
			socket.room = room;
			socket.pass = passPrivate;
		} else if (numClients < nbClientMax) {
		   joinOrReject(room, passPrivate);
		} else { // max nbClientMax clients
			socket.emit('full', room);
		}
	});
	
	socket.on('set pass room', function (room, pass) {
		setPass(room, pass);
	});

   // when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(room, username, ip){
	   socket.username = username;
	   insertUser(username, ip, room);
	   // echo to room 1 that a person has connected to their room
	   var text = username + ' has connected to this room';
      var date = new Date(Date.now());
      insertMessage(username, room, date, text);
	});
	
	socket.on('isUniqueName', function(username, room, balise) {
	   isUnique(username, room, balise);
	});
	
	socket.on('newMessage', function(text){
	   // echo to room 1 the message of username
		io.sockets.in(socket.room).emit('updatechat', socket.username, text);
	   var date = new Date(Date.now());
      insertMessage(socket.username, socket.room, date, text);
	});
	
	socket.on('newMessageConnexion', function(text){
	   // echo to room 1 the message of username
		io.sockets.in(socket.room).emit('updateChatConnexion', socket.username, text);
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
	});
	
	socket.on('getFullFiles', function(){
	   // emit the files of the room to the client connected
	   getFiles(socket.room);
	});
	
	socket.on('banIP', function(username, passAdmin){
	   // add banned ip to db if the creator emit banIP
	   banIP(socket.room, username, passAdmin);
	});
	
	socket.on('iAmTheUser', function(){
	   // add banned ip to db if the creator emit banIP
	   //banIP(socket.room, socket.handshake.address.address, "127.0.0.1");
	   //console.log('I am the user');
	   deleteUser(socket.username, socket.room);
	   socket.leave(socket.room);
	});
	
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

