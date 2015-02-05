var chatClasses = ["color1","color2","color3","color4"];
var chatClassIndex = 0;
var chatUsernameClass = {}

function sendNewChat(){
    getSocket().emit('newMessage',$('#dataChannelSend').val());
    $("#dataChannelSend").val("");
}

function appendNewChat(user,newMessage){
    var chatClassToUse = "";

    if (chatUsernameClass[user]){
        chatClassToUse = chatUsernameClass[user];
    }else{
        chatUsernameClass[user] = chatClasses[classIndex];
        chatClassToUse = chatUsernameClass[user];
        chatClassIndex = (chatClassIndex + 1)%chatClasses.length;
    }
    $('#dataChannelReceive').append("<div class='"+chatClassToUse+"'>"+user+"&nbsp;:</div>"+"<div class='"+chatClassToUse+"-paragraph'>"+newMessage+"</div>");
}

function appendServerMessage(user,newMessage,className){
    $('#chat-table').append("<div class='"+className+"'>"+user+"&nbsp;:&nbsp;"+newMessage+"</div>");
}