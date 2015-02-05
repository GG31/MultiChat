var classes = ["color1","color2","color3","color4"];
var classIndex = 0;
var usernameClass = {}

function sendNewChat(){
    getSocket().emit('newMessage',$('#dataChannelSend').val());
    $("#dataChannelSend").val("");
}

function appendNewChat(user,newMessage){
    var classToUse = "";

    if (usernameClass[user]){
        classToUse = usernameClass[user];
    }else{
        usernameClass[user] = classes[classIndex];
        classToUse = usernameClass[user];
        classIndex = (classIndex + 1)%classes.length;
    }

    $('#dataChannelReceive').append("<div class='"+classToUse+"'>"+user+"&nbsp;:</div>"+"<div class='"+classToUse+"-paragraph'>"+newMessage+"</div>");
}

function appendServerMessage(user,newMessage,className){
    $('#chat-table').append("<div class='"+className+"'>"+user+"&nbsp;:&nbsp;"+newMessage+"</div>");
}