var username = "";
function getUsername(){
    return username;
}


var room = location.pathname.split('/')[2];
function getRoom(){
    return room;
}
function setRoom(r){
    room = r;
}

var socket;
function getSocket(){
    return socket;
}
function setSocket(s){
    socket = s;
}

socket = initializeSocket();
initRoomCheck();

function initializeServerConstraints(){
    // Configuration des serveurs stun...
    var pc_config = webrtcDetectedBrowser === 'firefox' ?
      {'iceServers':[{'url':'stun:23.21.150.121'}]} : // number IP
      {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};

    // Peer connection constraints
    var pc_constraints = {
      'optional': [
        {'DtlsSrtpKeyAgreement': true},
        {'RtpDataChannels': true}
      ]};

    // Set up audio and video regardless of what devices are present.
    var sdpConstraints = {'mandatory': {
      'OfferToReceiveAudio':true,
      'OfferToReceiveVideo':true }
    };
    
    return [pc_config,pc_constraints,sdpConstraints];
}

function initializeSocket(){
    // Demande de connexion au serveur de sockets. Si on regarde le code du
    // server dans server.js on verra que si on est le premier client connecté
    // on recevra un message "created", sinon un message "joined"
    var socket = io.connect();
    setOnMethods(socket);
    return socket;
}

function initRoomCheck(){
    var room = getRoom();
    var socket = getSocket();
    
    console.log("In room " + room);
    if (room != '') {
      console.log('Create or join room', room);
      socket.emit('create or join', room, "", "");
      //socket.emit('sendMsg', username, room, "MESSAGE");
    } else {
       room = prompt('Enter room name:');
       socket.emit('create or join', room, "", "");
    }
    
    setRoom(room);
}