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
    socket.emit('getFullHistory');
}

function roomJoinedLog(room){
    var text = "<div class='connect'>" + getUsername() + " has joined room "+ room + "</div>";
    storeLog(text,room);
}

function createHistory(arrayHistory){
    var htmlHistory = "";
    for(var i = 0 ; i < arrayHistory.length ; i++) htmlHistory+="<p>"+arrayHistory[i]+"</p>";
    $('#historical-container-area').html(htmlHistory);
}