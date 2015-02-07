/* ******************************************************
REQUIRED VARIABLE
****************************************************** */

//Chat
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

function appendNewElementToHistory(text){
    $('#historical-container-area').append(text);
}

function getFullHistory(){
    console.log("ask for full history");
    socket.emit('getFullHistory');
    console.log("asked");
}

function roomJoinedLog(room){
    var text = "<div class='connect'>" + getUsername() + " has joined room "+ room + "</div>";
    storeLog(text,room);
}

function uploadFileLog(fileName){
    var text = "<div class='transfer'>" + getUsername() + " has uploaded "+ fileName + "</div>";
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
function linkOnClick() {
   console.log("on function");
   getSocket().emit('download');
}

function StartUpload(){
        FReader = new FileReader();
        Name = SelectedFile.name;
       
        FReader.onload = function(evnt){
            getSocket().emit('Upload', { 'Name' : Name, Data : evnt.target.result });
        }
        getSocket().emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size });
}

function getFile(fileName){
    alert("ask for "+fileName);
    getSocket().emit("getFile",fileName);
}

/*Downloader file and send log to the room*/
function downloadFile(file){
   console.log("ON DOWNLOAD");
   getSocket().emit("newLog",getUsername() + " has downloaded "+ file);
   $('<form action="download/'+getRoom()+'/'+file+'"></form>').submit();
}

function uploadFile(file){
   getSocket().emit("uploadFile",file);
   uploadFileLog(fileName);
}

//Sockets
getSocket().on('MoreData', function (data){
       var Place = data['Place'] * 524288; //The Next Blocks Starting Position
       var NewFile; //The Variable that will hold the new Block of Data
       if(SelectedFile.webkitSlice)
           NewFile = SelectedFile.webkitSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       else
           NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       FReader.readAsBinaryString(NewFile);
   });

/* ******************************************************
ROOM MANAGEMENT
****************************************************** */    

// Si on reçoit le message "created" alors on est l'initiateur du call
getSocket().on('created', function (room){
    console.log('Created room ' + room);
    roomCreationLog(room);
    getFullHistory();
    setIsInitiator(true);
});

function newRoom(){
    username = $("#usernameInput").val();

    if( ($("#pwdAdmin").val().length==0 && $("#pwdRoom").val().length>0) || ($("#pwdAdmin").val().length>0 && $("#pwdRoom").val().length==0) ){
        $("#errorPasswords").attr("display","inline");
    }else {
        $("#errorPasswords").attr("display","none");
        createOrJoin(getRoom(),$("#pwdAdmin").val(),$("#pwdRoom").val());
    }
}

function createOrJoin(room,pwdAdmin,pwdRoom){
    if (room != '') {
        console.log('Create or join room', room);
        socket.emit('create or join', room, pwdAdmin, pwdRoom);
        //socket.emit('sendMsg', username, room, "MESSAGE");
    } else {
        room = prompt('Enter room name:');
        socket.emit('create or join', room, pwdAdmin, pwdAdmin);
    }
}
