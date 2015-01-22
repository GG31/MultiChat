var classes = ["color1","color2","color3","color4"];
var classIndex = 0;

function sendNewChat(){
    getSocket().emit('newMessage',$('#dataChannelSend').val());
}

function appendNewChat(user,newMessage){
    $('#chat-table').append("<tr>"+"<td class='"+classes[classIndex]+"'>"+user+"&nbsp;:</td>"+"<td>"+newMessage+"</td>"+"</tr>");
    classIndex = (classIndex + 1)%classes.length;
}