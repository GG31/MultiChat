var Files = {};
var fs = require('fs')

module.exports.setOnMethods = function(socket, io) {
   socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
     var Name = data['Name'];
     Files[Name] = {  //Create a new Entry in The Files Variable
         FileSize : data['Size'],
         Data     : "",
         Downloaded : 0,
         Name_id : Name,
     }
     //
     //If directory doesn't exist, create it
     if (!fs.existsSync('files/' + socket.room)){
          fs.mkdirSync('files/' + socket.room);
      }
      
     var Place = 0;
     try{
         var Stat = fs.statSync('files/' + socket.room + '/' +  Files[Name]['Name_id']);
         if(Stat.isFile())
         {
             Files[Name]['Name_id'] = findName(Name, socket.room);
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
             Files[Name]['Handler'] = fd; // Store the file handler so we can write to it later
             socket.emit('MoreData', { 'Place' : Place, Percent : 0 });
         }
     });
     insertFile(socket.room, Files[Name]['Name_id'], Name, socket.username, new Date(Date.now()));
   });
   socket.on('Upload', function (data){
        var Name = data['Name'];
        Files[Name]['Downloaded'] += data['Data'].length;
        Files[Name]['Data'] += data['Data'];
        if(Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
        {
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
            });
            io.sockets.in(socket.room).emit('newFile', Files[Name]['Name_id']);
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
}

// Return a unique file name in the folder
findName = function(Name, room) {
   var filesOfDir = fs.readdirSync('files/' + room).sort();
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
