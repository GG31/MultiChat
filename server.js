var express = require('express');
var http = require('http');
var app = express();

app.use('/room/',  express.static(__dirname + '/'));
app.configure(function(){
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.bodyParser({uploadDir:'./uploads'}));
});

var server;
var io;
var mongo = require('./mongo.js');

var nbClientMax = 5;
server = app.listen(2013);
var io = require('socket.io').listen(server);
/*Files*/
var ss = require('socket.io-stream');
var path = require('path');
var fs = require('fs');
/**/
io.sockets.on('connection', function (socket){
   mongo.setOnMethods(socket);
   /*Files
   ss(socket).on('profile-image', function(stream, data) {
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename));
  });
   */
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
	
   socket.on('download', function(){
      fs.readFile(__dirname + '/files/img.png', function(err, buf){
         // it's possible to embed binary data
         // within arbitrarily-complex objects
         socket.emit('image', { image: true, buffer: buf.toString('base64') });
         console.log('image file is initialized');
      });  
   });

   socket.on('upload', function(data){
      var nameFile = 'test.txt';
      fs.createWriteStream(__dirname + "/tmp/" + nameFile);
   });
});

app.get('/room/:name', function (req, res) {  
  //verifyBan(req, res);
  res.sendfile(__dirname + '/index.html');
});
app.get('/privateroom/:name', function (req, res) {  
  res.sendfile(__dirname + '/index.html');  
});

app.post('/file-upload', function(req, res, next) {
    // get the temporary location of the file
    var tmp_path = req.files.thumbnail.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = './public/images/' + req.files.thumbnail.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
        });
    });
});
/*app.get('/download', function(req, res){
  var file = __dirname + '/files/test.txt';
  res.download(file); // Set disposition and send it.
});

app.get('/upload', function(req, res){
   fs.createReadStream(__dirname +'/files/test.txt').pipe(fs.createWriteStream(__dirname +"/tmp/test.txt"));
}); 
  */


