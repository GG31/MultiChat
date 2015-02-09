/* ******************************************************
REQUIRED VARIABLE
****************************************************** */

//Chat
var chatClasses = ["color1","color2","color3","color4"];
var chatClassIndex = 0;
var chatUsernameClass = {}

//File
window.addEventListener("load", Ready);
var SelectedFile;
var FReader;
var Name;

/* ******************************************************
CHAT MANAGEMENT
****************************************************** */

function sendNewChat(){
    if ($("#dataChannelSend").val().length > 0){
        getSocket().emit('newMessage',$('#dataChannelSend').val());
        $("#dataChannelSend").val("");
    }
}

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

function appendServerMessage(user,newMessage,className){
    $('#chat-table').append("<div class='"+className+"'>"+user+"&nbsp;:&nbsp;"+newMessage+"</div>");
}

/* ******************************************************
HISTORY MANAGEMENT
****************************************************** */

function storeLog(text,room){
    socket.emit('newLog',getHTMLToday() + text);
    console.log("new log emit");
}

function roomCreationLog(room){
    var text = "<div class='connect'>" + getUsername() + " has created room "+ room + "</div>";
    storeLog(text,room);
}
function appendDisconnect(user, room){
    var text = user + " has disconnected room "+ room;
    storeLog("<div class='disconnect'>"+text+"</div>", room);
}

function appendNewElementToHistory(text){
    $('#historical-container-area').append(text);
}

function getFullHistory(){
    console.log("ask for full history");
    socket.emit('getFullHistory');
    console.log("asked");
}

function getFullFiles() {
   socket.emit('getFullFiles');
}

function roomJoinedLog(room){
    getSocket().emit('newMessageConnexion', " has joined the room");
    var text = "<div class='connect'>" + getUsername() + " has joined room "+ room + "</div>";
    storeLog(text,room);
}

function uploadFileLog(fileName){
    var text = "<div class='transfer'>" + getUsername() + " has uploaded "+ fileName + "</div>";
}

function roomDisconnectLog(fileName){
    var text = "<div class='disconnect'>" + getUsername() + " has disconnected</div>";
}

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
function Ready(){
    if(window.File && window.FileReader){ //These are the relevant HTML5 objects that we are going to use
        document.getElementById('UploadButton').addEventListener('click', StartUpload); 
        document.getElementById('FileBox').addEventListener('change', FileChosen);
    }
    else
    {
        document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
    }
    //linkOnClick(); //Décommente et download du fichier files/n/help.txt starts
}

function linkOnClick() {
   console.log("on function");
   getSocket().emit('download');
}

function FileChosen(evnt, i) {
    SelectedFile = evnt.target.files[i];
    document.getElementById('NameBox').value = SelectedFile.name;
}

function StartUpload(){
    /*if(document.getElementById('FileBox').value != "")
    {*/
        FReader = new FileReader();
        Name = SelectedFile.name;
        var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
        Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
        Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
        document.getElementById('UploadArea').innerHTML = Content;
        FReader.onload = function(evnt){
            getSocket().emit('Upload', { 'Name' : Name, Data : evnt.target.result });
        }
        getSocket().emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size });
    /*}
    else
    {
        alert("Please Select A File");
    }*/
}

function download(content, filename, contentType){
    if(!contentType) contentType = 'application/octet-stream';
        var a = document.createElement('a');
        var blob = new Blob([content], {'type':contentType});
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
}

function refresh(){
    location.reload(true);
}

function UpdateBar(percent){
   document.getElementById('ProgressBar').style.width = percent + '%';
   document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
   var MBDone = Math.round(((percent/100.0) * SelectedFile.size) / 1048576);
   document.getElementById('MB').innerHTML = MBDone;
}

function getFile(fileName){
    alert("ask for "+fileName);
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
       UpdateBar(data['Percent']);
       var Place = data['Place'] * 524288; //The Next Blocks Starting Position
       var NewFile; //The Variable that will hold the new Block of Data
       if(SelectedFile.webkitSlice)
           NewFile = SelectedFile.webkitSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       else
           NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       FReader.readAsBinaryString(NewFile);
   });

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
    setIsInitiator(true);
    $('.container').css({display : 'none'});
    $('#containerIndex').css({display : 'block'});
});

function newRoom(){
    username = $("#usernameInput").val();
    room = getRoom();
    console.log("the room is " + room);
   //
    if( ($("#pwdAdmin").val().length==0 && $("#pwdRoom").val().length>0) || ($("#pwdAdmin").val().length>0 && $("#pwdRoom").val().length==0) ){
         console.log('ici');
      $('#errorPasswords').css({display :"block"});
    }else {
      $('#errorPasswords').css({display :"none"});
        console.log("on newRoom");
        socket.emit('adduser',getRoom(), username); 
        socket.emit('createRoom',room, $("#pwdAdmin").val(), $("#pwdRoom").val());
        createOrJoin(getRoom(),$("#pwdAdmin").val(),$("#pwdRoom").val());
    }
}

function logRoom(){
    username = $("#usernameLogRoom").val();
    console.log("adduser "+username+" on room " + getRoom());
    socket.emit('adduser', getRoom(), username);
    createOrJoin(getRoom(),$("#pwdAdmin").val(),$("#pwdRoom").val());
}

function logPrivateRoom() {
    username = $("#usernameLogPrivateRoom").val();
    pwdRoom = $("#pwdLogPrivateRoom").val();
    if(pwdRoom.length==0){ // || mauvais mot de passe // wrongPass mongo.js si mauvais mot de passe
      $('#errorPrivatePassword').css({display :"block"});
    } else {
      socket.emit('adduser', getRoom(), username);
      createOrJoin(getRoom(),"",pwdRoom);
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
