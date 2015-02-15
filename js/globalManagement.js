/* ******************************************************
REQUIRED VARIABLES
****************************************************** */

//Chat. 4 people max in the room, 4 colors according to their arrival order.
var chatClasses = ["color1","color2","color3","color4"];
var chatClassIndex = 0;
var chatUsernameClass = {}

//File
//window.addEventListener("load", Ready);
var SelectedFile;
var FReader;
var Name;

/* ******************************************************
CHAT MANAGEMENT
****************************************************** */

//Get the text in the #dataChannelSend input, and emit 'newMessage' so it could be broadcasted to the room. Then empty it.
function sendNewChat(){
    if ($("#dataChannelSend").val().length > 0){
        getSocket().emit('newMessage',$('#dataChannelSend').val());
        $("#dataChannelSend").val("");
    }
}

// When a chat newMessage from the user "user" is received, we check if a color has been attributed to the user (if no, we pick one), and then append message to the chat.
function appendNewChat(user,newMessage){
    var chatClassToUse = "";

    if (chatUsernameClass[user]){
        chatClassToUse = chatUsernameClass[user];
    }else{
        chatUsernameClass[user] = chatClasses[chatClassIndex];
        chatClassToUse = chatUsernameClass[user];
        chatClassIndex = (chatClassIndex + 1)%chatClasses.length;
    }
    $('#dataChannelReceive').append("<div class='"+chatClassToUse+"'>"+user+"&nbsp;:</div>"+"<div class='"+chatClassToUse+"-paragraph'>"+newMessage+"</div>");
}

// Same as appendNewChat.
function appendConnexionChat(user,newMessage){
    var chatClassToUse = "";

    if (chatUsernameClass[user]){
        chatClassToUse = chatUsernameClass[user];
    }else{
        chatUsernameClass[user] = chatClasses[chatClassIndex];
        chatClassToUse = chatUsernameClass[user];
        chatClassIndex = (chatClassIndex + 1)%chatClasses.length;
    }
    $('#dataChannelReceive').append("<div><span class='"+chatClassToUse+"'>"+user+"&nbsp;:</span>"+"<span class='"+chatClassToUse+"-paragraph'>"+newMessage+"</span></div>");
}

// This method appends global Server messages to the chat.
function appendServerMessage(user,newMessage,className){
    $('#chat-table').append("<div class='"+className+"'>"+user+"&nbsp;:&nbsp;"+newMessage+"</div>");
}

/* ******************************************************
HISTORY MANAGEMENT
****************************************************** */

//History is based on logs. This method ask the server to store a log for a room.
function storeLog(text,room){
    socket.emit('newLog',getHTMLToday() + text);
    console.log("new log emit");
}

//roomCreationLog, appendDisconnect, and roomJoinedLog are methods that specifies which message send to storeLog
function roomCreationLog(room){
    var text = "<div class='connect'>" + getUsername() + " has initated room "+ room + "</div>";
    storeLog(text,room);
}
function appendDisconnect(user, room){
    var text = user + " has disconnected from room "+ room;
    storeLog("<div class='disconnect'>"+text+"</div>", room);
}
function roomJoinedLog(room){
    getSocket().emit('newMessageConnexion', " has joined the room");
    var text = "<div class='connect'>" + getUsername() + " has joined room "+ room + "</div>";
    storeLog(text,room);
}

// This method simply adds a log to the history container on index.html. It is used when a new log is stored in the server
function appendNewElementToHistory(text){
    $('#historical-container-area').append(text);
}

// Called when a new user enters the room, get all the room logs from its creation.
function getFullHistory(){
    console.log("ask for full history");
    socket.emit('getFullHistory');
    console.log("asked");
}

// Same as full history, but to get all the files that have been uploaded to the room
function getFullFiles() {
   socket.emit('getFullFiles');
}

function uploadFileLog(fileName){
    var text = "<div class='transfer'>" + getUsername() + " has uploaded "+ fileName + "</div>";
}

function roomDisconnectLog(fileName){
    var text = "<div class='disconnect'>" + getUsername() + " has disconnected</div>";
}

// When getFullHistory() is called, server send back the json of the history elements. It then must ben parsed into an array, and used to create the HTML
function createHistory(arrayHistory){
    var historyToCreate = jQuery.parseJSON(arrayHistory);
    var htmlHistory = "";
    
    for(var i=0;i<historyToCreate.length;i++){
        htmlHistory += historyToCreate[i]["text"];
    }
    $('#historical-container-area').html(htmlHistory);
}

/* ******************************************************
FILE MANAGEMENT
****************************************************** */

//Functions
function StartUpload(){
     FReader = new FileReader();
     Name = SelectedFile.name;
     FReader.onload = function(evnt){
         getSocket().emit('Upload', { 'Name' : Name, Data : evnt.target.result });
     }
     getSocket().emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size });
}

function refresh(){
    location.reload(true);
}

function getFile(fileName){
    //alert("ask for "+fileName);
    getSocket().emit("getFile",fileName);
}

/*Downloader file and send log to the room*/
function downloadFile(file){
   //storeLog("<div class='download-file'>"+ getUsername() + " has downloaded "+ file+"</div>", room);
   $('<form action="download/'+getRoom()+'/'+file+'"></form>').submit();
   
}

function uploadFile(file){
    storeLog("<div class='upload-file'>"+ getUsername() + " has upload "+ file+"</div>", room);
    getSocket().emit("uploadFile",file);
    uploadFileLog(fileName)
}

//Sockets
getSocket().on('download', function (data){
    var blob = new Blob([data['buffer']], {type: "application/octet-binary"});
    var a = document.getElementById('downloadFile');
    a.href = window.URL.createObjectURL(blob);
    a.download = data['name'];
    a.click();
});

getSocket().on('MoreData', function (data){
       var Place = data['Place'] * 524288; //The Next Blocks Starting Position
       var NewFile; //The Variable that will hold the new Block of Data
       if(SelectedFile.webkitSlice)
           NewFile = SelectedFile.webkitSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       else
           NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       FReader.readAsBinaryString(NewFile);
   });

// Append a new uploaded file to the list
function appendFile(fileName) {
   var newFile = $('<li class="common-repository-li" onclick="downloadFile(\''+fileName+'\')">'+fileName+'</li>');
   //var newFile = $('<li class="common-repository-li" ><a href="#" onclick="downloadFile(\''+fileName+'\')">'+fileName+'</a></li>');
   $('#common-repository-ul').append(newFile);
}
/* ******************************************************
ROOM MANAGEMENT
****************************************************** */    

// Si on reçoit le message "created" alors on est l'initiateur du call
getSocket().on('created', function (room){
    console.log('Created room ' + room);
    roomCreationLog(room);
    getFullHistory();
    getFullFiles();
    isInitiator = true;
    $('.container').css({display : 'none'});
    $('#containerIndex').css({display : 'block'});
});

function newRoom(){
    username = $("#usernameInput").val();
    room = getRoom();
    console.log("the room is " + room);
   //
   if(username.length==0) {
      $('#errorLogNew').css({display :"block"});
   } else if( ($("#pwdAdmin").val().length==0 && $("#pwdRoom").val().length>0) || ($("#pwdAdmin").val().length>0 && $("#pwdRoom").val().length==0) ){
         console.log('ici');
      $('#errorPasswords').css({display :"block"});
      $('#errorLogNew').css({display :"none"});
   } else {
      $('#errorPasswords').css({display :"none"});
      $('#errorLogNew').css({display :"none"});
        console.log("on newRoom");
        try{
           $.getJSON("http://ip-api.com/json?callback=?",
            function(data){
            socket.emit('adduser',getRoom(), username, data.ip); 
            socket.emit('createRoom',room, $("#pwdAdmin").val(), $("#pwdRoom").val());
            createOrJoin(getRoom(),$("#pwdAdmin").val(),$("#pwdRoom").val())
         });
       } catch (e){
          socket.emit('adduser',getRoom(), username, ""); 
          socket.emit('createRoom',room, $("#pwdAdmin").val(), $("#pwdRoom").val());
          createOrJoin(getRoom(),$("#pwdAdmin").val(),$("#pwdRoom").val());
       }
    }
}

function logRoom(){
    username = $("#usernameLogRoom").val();
    if(username.length==0) {
      $('#errorLog').css({display :"block"});
   } else { // Verif pseudo unique
      $('#errorLog').css({display :"none"});
      socket.emit('isUniqueName', username, getRoom(), '#errorVerif');   
   }
}

function logPrivateRoom() {
    username = $("#usernameLogPrivateRoom").val();
    pwdRoom = $("#pwdLogPrivateRoom").val();
    if(username.length==0) {
     $('#errorLogPrivate').css({display :"block"});
   } else if(pwdRoom.length==0){ // || mauvais mot de passe // wrongPass mongo.js si mauvais mot de passe
      $('#errorLogPrivate').css({display :"none"});
      $('#errorPrivatePassword').css({display :"block"});
   } else { // Verif pseudo unique
      $('#errorLogPrivate').css({display :"none"});
      $('#errorPrivatePassword').css({display :"none"});
      socket.emit('isUniqueName', username, getRoom(), '#errorVerifPrivate');
   } 
} 
// Suite, aucune erreur logRoom ou logPrivateRoom
function nextVerifLog(balise){
   if(balise == '#errorVerif'){
      username = $("#usernameLogRoom").val();
      $('#errorLog').css({display :"none"});
      $(balise).css({display :"none"});
      try {
         $.getJSON("http://ip-api.com/json?callback=?",
            function(data){
            socket.emit('adduser', getRoom(), username, data.ip);
            createOrJoin(getRoom(),$("#pwdAdmin").val(),$("#pwdRoom").val());
         });
       } catch (e){
          socket.emit('adduser', getRoom(), username, "");
          createOrJoin(getRoom(),$("#pwdAdmin").val(),$("#pwdRoom").val());
       }
   } else {
      username = $("#usernameLogPrivateRoom").val();
      pwdRoom = $("#pwdLogPrivateRoom").val();
      $('#errorLogPrivate').css({display :"none"});
      $('#errorPrivatePassword').css({display :"none"});
      $(balise).css({display :"none"});
      try{
         $.getJSON("http://ip-api.com/json?callback=?",
            function(data){
            socket.emit('adduser', getRoom(), username, data.ip);
          createOrJoin(getRoom(),"",pwdRoom);
         });      
       } catch (e){
          socket.emit('adduser', getRoom(), username, "");
          createOrJoin(getRoom(),"",pwdRoom);
       }
   }
} 

function createOrJoin(room,pwdAdmin,pwdRoom){
    if (room != '') {
        console.log('Create or join room', room);
        socket.emit('create or join', room, pwdAdmin, pwdRoom);
        //socket.emit('sendMsg', username, room, "MESSAGE");
    } else {
        room = prompt('Enter room name:');
        socket.emit('create or join', room, pwdAdmin, pwdRoom);
    }
}
