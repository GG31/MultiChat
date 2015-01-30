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


module.exports.setOnMethods = function(socket) {
   /***************Files**************/
	/*Files*/
   socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
   console.log("onstart " + data['Name']);
     var Name = data['Name'];
     Files[Name] = {  //Create a new Entry in The Files Variable
         FileSize : data['Size'],
         Data     : "",
         Downloaded : 0,
         Name_id : Name,
     }
     //insertFile(socket.room, Name, Name);
     //If directory doesn't exist, create it
     if (!fs.existsSync('files/' + socket.room)){
          fs.mkdirSync('files/' + socket.room);
      }
      
     var Place = 0;
     try{
         var Stat = fs.statSync('files/' + socket.room + '/' +  Files[Name]['Name_id']);
         if(Stat.isFile())
         {
             /*Files[Name]['Downloaded'] = Stat.size;
             Place = Stat.size / 524288;*/
             Files[Name]['Name_id'] = findName(Name, socket.room);
             console.log("THE NAME IS " + Files[Name]['Name_id']);
         }
     }
     catch(er){} //It's a New File
     fs.open('files/' + socket.room + '/' + Files[Name]['Name_id'], "a", 0755, function(err, fd){
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
            //console.log("writing");
            //socket.emit('Done', {'file' : Files[Name]['Name_id']});
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
	
	
   socket.on('download', function(){
      var filename = 'help.txt';
      fs.readFile(__dirname + '/files/n/'+filename, 'Binary', function(err, buf){
         // it's possible to embed binary data
         // within arbitrarily-complex objects
         socket.emit('download', { image: filename, buffer: buf, name: filename});
         console.log('image file is initialized ' + filename);
      });  
   });
   /**********************************/
}

findName = function(Name, room) {
   var filesOfDir = fs.readdirSync('files/' + room).sort();
   console.log(filesOfDir);
   var nb = 0;
   var i = Name.lastIndexOf('.');
   var first = Name.substr(0,i);
   var end = Name.substr(i);
   while(true) {
      console.log(filesOfDir.indexOf(Name));
      if(filesOfDir.indexOf(Name) == -1) {
         return Name;
      } else {
         Name = first + '_' + nb + end;
         nb = nb + 1;
      }
   }
}
