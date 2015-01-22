function storeLog(text,room){
    socket.emit('newLog',text);
}

function roomCreationLog(room){
    var text = getUsername() + " has created room "+ room;
    storeLog(text,room);
}

function appendNewElementToHistory(text){
    $('#historical-container-area').append("<p>"+text+"</p>");
}

function getFullHistory(){
    socket.emit('getFullHistory');
}

function roomJoinedLog(room){
    var text = getUsername() + " has joined room "+ room;
    storeLog(text,room);
}

function createHistory(arrayHistory){
    var htmlHistory = "";
    for(var i = 0 ; i < arrayHistory.length ; i++) htmlHistory+="<p>"+arrayHistory[i]+"</p>";
    $('#historical-container-area').html(htmlHistory);
}