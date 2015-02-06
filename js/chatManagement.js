var classes = ["color1","color2","color3","color4"];
var classIndex = 0;

function sendNewChat(){
    $("#dataChannelSend").attr("value","");
    getSocket().emit('newMessage',$('#dataChannelSend').val());
}

function appendNewChat(user,newMessage){
    $('#dataChannelReceive').append("<div class='"+classes[classIndex]+"'>"+user+"&nbsp;:</div>"+"<div class='"+classes[classIndex]+"-paragraph'>"+newMessage+"</div>");
    classIndex = (classIndex + 1)%classes.length;
}

function appendServerMessage(user,newMessage,className){
    $('#chat-table').append("<div class='"+className+"'>"+user+"&nbsp;:&nbsp;"+newMessage+"</div>");
}
