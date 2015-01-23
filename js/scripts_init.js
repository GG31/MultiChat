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
      socket.emit('create or join', room, username);
      //socket.emit('sendMsg', username, room, "MESSAGE");
    } else {
       room = prompt('Enter room name:');
       socket.emit('create or join', room, username);
    }
    
    setRoom(room);
}