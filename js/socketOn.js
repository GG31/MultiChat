function setOnMethods(socket){
    socket.on('connect', function(){
        //username = prompt("What's your name?");
        //socket.emit('adduser', getRoom(), getUsername());
        //console.log("username " + getUsername);
        console.log("on connect");
    });

    // On a essayé de rejoindre une salle qui est déjà pleine (avec deux personnes)
    socket.on('full', function (room){
      console.log('Room ' + room + ' is full');
    });

    // Appelé quand un nouveau client rejoint la room
    socket.on('join', function (room){
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      isChannelReady = true;
      
      var geolocation = "gmaps"+getPosition();
      if(geolocation)socket.emit('messageForRoom',geolocation);
      
      console.log('try sending position to others : '+geolocation);
    });
    
    socket.on('amITheUser',function(ip){
      $.getJSON("http://ip-api.com/json?callback=?",
      function(data){
         if (data.ip == ip) {
            socket.emit('iAmTheUser');
         }
      });
    });

    // Si on reçoit le message "joined" alors on a rejoint une salle existante
    // on est pas l'initiateur, il y a déjà quelqu'un (l'appelant), donc
    // on est prêt à communiquer...
    socket.on('joined', function (room){
      console.log('This peer has joined room ' + room);
      roomJoinedLog(room);
      $('.container').css({display : 'none'});
      $('#containerIndex').css({display : 'block'});
      getFullHistory();
      getFullFiles();
      isChannelReady = true;
      
      var geolocation = "gmaps"+getPosition();
      if(geolocation)socket.emit('messageForRoom',geolocation);
      
      console.log('try sending position to others : '+geolocation);
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

    socket.on('updateHistory', function(text){
        appendNewElementToHistory(text);
    });
    
    socket.on('fullHistory',function(arrayHistory){
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
    
    socket.on('typePage',function(type) {
      $('.container').css({display :'none'});
      $('#'+type).css({display : 'block'});
    });
    
    socket.on('isUnique', function(verif, balise) {
      if(!verif){
         $(balise).css({display :"block"});
      } else {
         $(balise).css({display :"none"});
         nextVerifLog(balise);
      }
    });
}
