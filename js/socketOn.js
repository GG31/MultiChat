function setOnMethods(socket){
    socket.on('connect', function(){
        username = prompt("What's your name?");
        socket.emit('adduser', getRoom(), getUsername());
        console.log("username " + getUsername);
    });

    // On a essayé de rejoindre une salle qui est déjà pleine (avec deux personnes)
    socket.on('full', function (room){
      console.log('Room ' + room + ' is full');
    });

    // Appelé quand un nouveau client rejoint la room
    socket.on('join', function (room){
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      setIsChannelReady(true);
    });

    // Si on reçoit le message "joined" alors on a rejoint une salle existante
    // on est pas l'initiateur, il y a déjà quelqu'un (l'appelant), donc
    // on est prêt à communiquer...
    socket.on('joined', function (room){
      console.log('This peer has joined room ' + room);
      roomJoinedLog(room);
      getFullHistory();
      getFullFiles();
      enableMessageInterface(true);
      setIsChannelReady(true);
    });

    // Appelé par le serveur pour faire des traces chez les clients connectés
    socket.on('log', function (array){
      console.log.apply(console, array);
    });

    socket.on('updatechat', function (username, data) {
       //à écrire dans la conversation : data // username = SERVER, data = msg
        //$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
        appendNewChat(username,data);
    });
    socket.on('updateChatConnexion', function (username, data) {
       //à écrire dans la conversation : data // username = SERVER, data = msg
        //$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
        appendConnexionChat(username,data);
    });
    socket.on('updateDisconnect', function (username, room) {
         appendConnexionChat(username," has disconnected the room");
        appendDisconnect(username, room);
    });
    
    // Récépeiton de message générique.
    socket.on('message', function (message){
      console.log('Received message:', message);


      if (message === 'got user media') {
        // On ouvre peut-être la connexion p2p
        maybeStart();
      } else if (message.type === 'offer') {

        if (!getIsInitiator() && !getIsStarted()) {
          // on a recu une "offre" on ouvre peut être la connexion so on
          // est pas appelant et si on ne l'a pas déjà ouverte...
          maybeStart();
        }

        // si on reçoit une offre, on va initialiser dans la connexion p2p
        // la "remote Description", avec le message envoyé par l'autre pair 
        // (et recu ici)
        pc.setRemoteDescription(new RTCSessionDescription(message));

        // On envoie une réponse à l'offre.
        doAnswer();
      } else if (message.type === 'answer' && getIsStarted()) {
        // On a reçu une réponse à l'offre envoyée, on initialise la 
        // "remote description" du pair.
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && getIsStarted()) {
        // On a recu un "ice candidate" et la connexion p2p est déjà ouverte
        // On ajoute cette candidature à la connexion p2p. 
        var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
          candidate:message.candidate});
        pc.addIceCandidate(candidate);
      } else if (message === 'bye' && getIsStarted()) {
        handleRemoteHangup();
      }
    });

    socket.on('updateHistory', function(text){
        appendNewElementToHistory(text);
    });
    
    socket.on('fullHistory',function(arrayHistory){
        console.log("response for history");
        createHistory(arrayHistory);
    });
    
    socket.on('fullFiles',function(arrayFilesName){
        var obj = jQuery.parseJSON(arrayFilesName);
        $.each(obj, function(index, value ) {
            appendFile(value.filename);
        });
    });
    
    socket.on('newFile',function(fileName){
        appendFile(fileName);
    });
    
}
