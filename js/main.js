'use strict';

var sendChannel;
var constraints = {video: true};

/* ****************************************************************
DOM elements
**************************************************************** */
var sendTextarea = document.getElementById("dataChannelSend");
var receiveTextarea = document.getElementById("dataChannelReceive");

/* ****************************************************************
Boolean checks
**************************************************************** */
var isChannelReady;
var isInitiator;
var isStarted = false;

/* ****************************************************************
Streaming vars
**************************************************************** */
var localStream;
var pc;
var remoteStream;
var ephemeralStream;
var turnReady;
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var activeVideo = document.querySelector('#activeVideo');

/* ****************************************************************
User info
**************************************************************** */
var room = location.pathname.split('/')[2];

/* ****************************************************************
Getters
**************************************************************** */

function getIsInitiator(){
    return isInitiator;
}
function getIsStarted(){
    return isStarted;
}
function getIsChannelReady(){
    return isChannelReady;
}
function getLocalVideo(){
    return localVideo;
}
function getremoteVideo(){
    return remoteVideo;
}
function getConstraints(){
    return constraints;
}

/* ****************************************************************
Setters
**************************************************************** */
function setIsInitiator(initiator){
    isInitiator = initiator;
}
function setIsStarted(started){

    isStarted = started;
}
function setIsChannelReady(ready){
    isChannelReady = ready;
}
function setLocalStream(stream){
    localStream = stream;
}
function setConstraints(c){
    constraints = c;
}

/* ****************************************************************
Initialization
**************************************************************** */
var initConstraints = initializeServerConstraints();
var pc_config = initConstraints[0];
var pc_constraints = initConstraints[1];
var sdpConstraints = initConstraints[2];

// Envoi de message générique, le serveur broadcaste à tout le monde
// par défaut (ce sevrait être que dans la salle courante...)
// Il est important de regarder dans le code de ce fichier quand on envoit
// des messages.
function sendMessage(message){
	console.log('Sending message: ', message);
  socket.emit('message', message);
}

getUserMedia(constraints, handleUserMedia, handleUserMediaError);
console.log('Getting user media with constraints', constraints);

// On regarde si on a besoin d'un serveur TURN que si on est pas en localhost
console.log("hostname : "+location.hostname);
if (location.hostname != "localhost" && location.hostname != "127.0.0.1") {
  requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
}

// On démarre peut être l'appel (si on est appelant) que quand on a toutes les 
// conditons. Si on est l'appelé on n'ouvre que la connexion p2p   
// isChannelReady = les deux pairs sont dans la même salle virtuelle
//                  via websockets
// localStream = on a bien accès à la caméra localement,
// !isStarted = on a pas déjà démarré la connexion.
// En résumé : on établit la connexion p2p que si on a la caméra et les deux
// pairs dans la même salle virtuelle via WebSockets (donc on peut communiquer
// via WebSockets par sendMessage()...)
function maybeStart() {
    console.log("MAYBE START");
  //if (!isStarted && localStream && isChannelReady) {
  if (!isStarted){
    // Ouverture de la connexion p2p
    createPeerConnection();
    // on donne le flux video local à la connexion p2p. Va provoquer un événement 
    // onAddStream chez l'autre pair.
    pc.addStream(localStream);
    console.log("stream add to peer");
    // On a démarré, utile pour ne pas démarrer le call plusieurs fois
    isStarted = true;
    // Si on est l'appelant on appelle. Si on est pas l'appelant, on ne fait rien.
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function(e){
	sendMessage('bye');
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    // Ouverture de la connexion p2p
    pc = new RTCPeerConnection(pc_config, pc_constraints);

    // ecouteur en cas de réception de candidature
    pc.onicecandidate = handleIceCandidate;

    console.log('Created RTCPeerConnnection with:\n' +
      '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
      '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
  // Ecouteur appelé quand le pair a enregistré dans la connexion p2p son
  // stream vidéo.
  pc.onaddstream = handleRemoteStreamAdded;

  // Ecouteur appelé quand le pair a retiré le stream vidéo de la connexion p2p
  pc.onremovestream = handleRemoteStreamRemoved;

  // Data channel. Si on est l'appelant on ouvre un data channel sur la 
  // connexion p2p
  if (isInitiator) {
    try {
      // Reliable Data Channels not yet supported in Chrome
      sendChannel = pc.createDataChannel("sendDataChannel",
        {reliable: false});

      // écouteur de message reçus
      sendChannel.onmessage = handleMessage;

      trace('Created send data channel');
    } catch (e) {
      alert('Failed to create data channel. ' +
            'You need Chrome M25 or later with RtpDataChannel enabled');
      trace('createDataChannel() failed with exception: ' + e.message);
    }

    // ecouteur appelé quand le data channel est ouvert
    sendChannel.onopen = handleSendChannelStateChange;
    // idem quand il est fermé.
    sendChannel.onclose = handleSendChannelStateChange;
  } else {
    // ecouteur appelé quand le pair a enregistré le data channel sur la 
    // connexion p2p
    pc.ondatachannel = gotReceiveChannel;
  }
}

function sendData() {
  var data = sendTextarea.value;
  sendChannel.send(data);
  trace('Sent data: ' + data);
}

// function closeDataChannels() {
//   trace('Closing data channels');
//   sendChannel.close();
//   trace('Closed data channel with label: ' + sendChannel.label);
//   receiveChannel.close();
//   trace('Closed data channel with label: ' + receiveChannel.label);
//   localPeerConnection.close();
//   remotePeerConnection.close();
//   localPeerConnection = null;
//   remotePeerConnection = null;
//   trace('Closed peer connections');
//   startButton.disabled = false;
//   sendButton.disabled = true;
//   closeButton.disabled = true;
//   dataChannelSend.value = "";
//   dataChannelReceive.value = "";
//   dataChannelSend.disabled = true;
//   dataChannelSend.placeholder = "Press Start, enter some text, then press Send.";
// }

// Le data channel est créé par l'appelant. Si on entre dans cet écouteur
// C'est qu'on est l'appelé. On se contente de le récupérer via l'événement
function gotReceiveChannel(event) {
  trace('Receive Channel Callback');
  sendChannel = event.channel;
  sendChannel.onmessage = handleMessage;
  sendChannel.onopen = handleReceiveChannelStateChange;
  sendChannel.onclose = handleReceiveChannelStateChange;
}

function handleMessage(event) {
  trace('Received message: ' + event.data);
  receiveTextarea.value = event.data;
}

function handleSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  enableMessageInterface(readyState == "open");
}

function handleReceiveChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Receive channel state is: ' + readyState);
  enableMessageInterface(readyState == "open");
}

function enableMessageInterface(shouldEnable) {
    console.log("enableMessageInterface");
    if (shouldEnable) {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    dataChannelSend.placeholder = "";
    //sendButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    //sendButton.disabled = true;
  }
}

function handleIceCandidate(event) {
  // On a recu une candidature, c'est le serveur STUN qui déclenche l'event
  // quand il a réussi à déterminer le host/port externe.
  console.log('handleIceCandidate event: ', event);

  if (event.candidate) {
    // On envoie cette candidature à tout le monde.
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

// Exécuté par l'appelant uniquement
function doCall() {
  // M.Buffa : les contraintes et les configurations (SDP) sont encore 
  // supportées différements selon les browsers, et certaines propriétés du 
  // standard officiel ne sont pas encore supportées... bref, c'est encore
  // un peu le bazar, d'où des traitement bizarres ici par exemple...
  var constraints = {'optional': [], 'mandatory': {'MozDontOfferDataChannel': true}};
  // temporary measure to remove Moz* constraints in Chrome
  if (webrtcDetectedBrowser === 'chrome') {
    for (var prop in constraints.mandatory) {
      if (prop.indexOf('Moz') !== -1) {
        delete constraints.mandatory[prop];
      }
     }
   }
  constraints = mergeConstraints(constraints, sdpConstraints);
  console.log('Sending offer to peer, with constraints: \n' +
    '  \'' + JSON.stringify(constraints) + '\'.');

  // Envoi de l'offre. Normalement en retour on doit recevoir une "answer"
  pc.createOffer(setLocalAndSendMessage, null, constraints);
}

// Exécuté par l'appelé uniquement...
function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function mergeConstraints(cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
}

// callback de createAnswer et createOffer, ajoute une configuration locale SDP
// A la connexion p2p, lors de l'appel de createOffer/answer par un pair.
// Envoie aussi la description par WebSocket. Voir le traitement de la réponse
// au début du fichier sans socket.on("message" , ...) partie "answer" et "offer"
function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  // M.Buffa : là c'est de la tambouille compliquée pour modifier la 
  // configuration SDP pour dire qu'on préfère un codec nommé OPUS (?)
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);

  pc.setLocalDescription(sessionDescription);

  // Envoi par WebSocket
  sendMessage(sessionDescription);
}

// regarde si le serveur turn de la configuration de connexion
// (pc_config) existe, sinon récupère l'IP/host d'un serveur
// renvoyé par le web service computeengineondemand.appspot.com
// de google. La requête se fait en Ajax, résultat renvoyé en JSON.
function requestTurn(turn_url) {
  var turnExists = false;
  for (var i in pc_config.iceServers) {
    if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turn_url);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
      	console.log('Got TURN server: ', turnServer);
        pc_config.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turn_url, true);
    xhr.send();
  }
}

// Ecouteur de onremotestream : permet de voir la vidéo du pair distant dans 
// l'élément HTML remoteVideo
function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
 // reattachMediaStream(miniVideo, localVideo);
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
//  waitForRemoteVideo();
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

// bouton "on raccroche"
function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

// Fermeture de la connexion p2p
function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}

///////////////////////////////////////////
// M.Buffa : tambouille pour bidouiller la configuration sdp
// pour faire passer le codec OPUS en premier....
// 
// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}

var idVid = 0;
function appendVideo(vid,usrname){
    ephemeralStream = localStream;

    var text = "<div class='profil'><span class='color4'>"+usrname+"</span><img class='image-delete' src='images/croix.png' title='delete' onclick='tryBan(\""+usrname+"\");'><video id='streamVid_"+idVid+"' class='remoteVideo' onclick='makeVideoActive(ephemeralStream);' autoplay></video></div>";
    text += "<script>var element = document.querySelector('#streamVid_"+idVid+"');attachMediaStream(element, ephemeralStream);</script>";
    idVid += 1;
    
    $('#profils-container').append(text);
}

function makeVideoActive(videoStream){
    attachMediaStream(activeVideo,videoStream);
}

function tryBan(username){
    var promptPassword = prompt("Please enter the administration password","");
    if (promptPassword != null){
        getSocket().emit('banIP',usrname,promptPassword);
    }
}
