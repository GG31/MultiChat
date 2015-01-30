var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');

app.use('/room/',  express.static(__dirname + '/'));
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

var nbClientMax = 5;
server = app.listen(2013);
var io = require('socket.io').listen(server);
/*Files*/
var Files = {};
var fs = require('fs')
  , exec = require('child_process').exec
  , util = require('util')

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}
/**/
io.sockets.on('connection', function (socket){
   mongo.setOnMethods(socket);
   /*Files*/
   socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
   console.log("onstart");
     var Name = data['Name'];
     Files[Name] = {  //Create a new Entry in The Files Variable
         FileSize : data['Size'],
         Data     : "",
         Downloaded : 0
     }
     var Place = 0;
     try{
         var Stat = fs.statSync('Temp/' +  Name);
         if(Stat.isFile())
         {
             Files[Name]['Downloaded'] = Stat.size;
             Place = Stat.size / 524288;
         }
     }
     catch(er){} //It's a New File
     fs.open("Temp/" + Name, "a", 0755, function(err, fd){
         if(err)
         {
             console.log(err);
         }
         else
         {
            console.log("fs.open");
             Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
             socket.emit('MoreData', { 'Place' : Place, Percent : 0 });
         }
     });
   });
   socket.on('Upload', function (data){
      console.log("onupload");
        var Name = data['Name'];
        Files[Name]['Downloaded'] += data['Data'].length;
        Files[Name]['Data'] += data['Data'];
        if(Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
        {
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
            console.log("writing");
                //Get Thumbnail Here
                /*var inp = fs.createReadStream("Temp/" + Name);
var out = fs.createWriteStream("Video/" + Name);
util.pump(inp, out, function(){
    fs.unlink("Temp/" + Name, function () { //This Deletes The Temporary File
        //Moving File Completed
    });
});
exec("ffmpeg -i Video/" + Name  + " -ss 01:30 -r 1 -an -vframes 1 -f mjpeg Video/" + Name  + ".jpg", function(err){
    socket.emit('Done', {'Image' : 'Video/' + Name + '.jpg'});
});*/
            });
        }
        else if(Files[Name]['Data'].length > 10485760){ //If the Data Buffer reaches 10MB
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
                Files[Name]['Data'] = ""; //Reset The Buffer
                var Place = Files[Name]['Downloaded'] / 524288;
                var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
            });
        }
        else
        {
            var Place = Files[Name]['Downloaded'] / 524288;
            var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
        }
    });
   /**/
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
      fs.readFile('temp/xml/user/username.pdf',function(error,data){
    if(error){
       res.json({'status':'error',msg:err});
    }else{
       res.json({'status':'ok',msg:err,data:data});
    }
});
      console.log("on upload");
      var nameFile = 'test.png';
      fs.writeFile(__dirname + "/tmp/" + nameFile, data);
   });
});

app.get('/room/:name', function (req, res) {  
  //verifyBan(req, res);
  res.sendfile(__dirname + '/index.html');
});
app.get('/privateroom/:name', function (req, res) {  
  res.sendfile(__dirname + '/index.html');  
});

/*app.post('/file-upload', function(req, res, next) {
   console.log("plop " + req);
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
});*/
/*app.get('/download', function(req, res){
  var file = __dirname + '/files/test.txt';
  res.download(file); // Set disposition and send it.
});

app.get('/upload', function(req, res){
   fs.createReadStream(__dirname +'/files/test.txt').pipe(fs.createWriteStream(__dirname +"/tmp/test.txt"));
}); 
  */


