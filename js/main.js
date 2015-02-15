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
var isStarted;

/* ****************************************************************
Streaming vars
**************************************************************** */
var localStream, localPC, pc, remoteStream, ephemeralStream;
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var activeVideo = document.querySelector('#activeVideo');

var lastUsername = "";
var idVid = 0;
var streamList = [];

/* ****************************************************************
User info
**************************************************************** */
var room = location.pathname.split('/')[2];

/* ****************************************************************
Initialization
**************************************************************** */
var initConstraints = initializeServerConstraints();
var pc_config = initConstraints[0];
var pc_constraints = initConstraints[1];
var sdpConstraints = initConstraints[2];

/* ****************************************************************
Main work
**************************************************************** */
getLocalStream();
/* ****************************************************************
Main functions
**************************************************************** */

function getLocalStream(){
    getUserMedia({audio:true, video:true}, gotLocalStream, function(error) {
        trace("getUserMedia error: ", error);
    });
}

function gotLocalStream(stream){
    localStream = stream;
    attachMediaStream(localVideo,stream);
    console.log("Local stream got and added.");
    socket.emit("messageForRoom",'got user media');
    
    if (isInitiator) maybeStart();
}

function makeVideoActive(videoStream){
    attachMediaStream(activeVideo,videoStream);
}

function gotRemoteStream(event){
    streamList[idVid] = event.stream;
    console.log("Got remote stream !");
    var text = "<div class='profil'><span class='color4'>"+lastUsername+"</span><img class='image-delete' src='images/croix.png' title='delete' onclick='tryBan(\""+lastUsername+"\");'><video id='streamVid_"+idVid+"' class='remoteVideo' onclick='makeVideoActive(streamList["+idVid+"]);' autoplay></video></div>";
    text += "<script>var element = document.querySelector('#streamVid_"+idVid+"');attachMediaStream(element,streamList["+idVid+"]);</script>";
    idVid += 1;
    makeVideoActive(event.stream);
    $('#profils-container').append(text);
}

function maybeStart() {
  if (!isStarted && localStream && isChannelReady) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    if (isInitiator) {
      doCall();
    }
  }
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

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

socket.on('message', function (message){
    console.log('Received message: '+ message);
    
    if(message.length > 5 && message.substring(0,5)=="gmaps"){
        var globalPos = message.substring(5,message.length-1);
        var lat = parseFloat(globalPos.split(";;")[0]);
        var longit = parseFloat(globalPos.split(";;")[1]);
        addMarkerToMap(lat,longit);
    }else if (message === 'got user media') {
        maybeStart();
    } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) maybeStart();
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
        lastUsername = message.username;
        var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,candidate:message.candidate});
        pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
});

window.onbeforeunload = function(e){
	socket.emit('messageForRoom','bye');
}

function mergeConstraints(cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
}

function doCall() {
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
  pc.createOffer(setLocalAndSendMessage, null, constraints);
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  sessionDescription.username = username;
  pc.setLocalDescription(sessionDescription);
  socket.emit('messageForRoom',sessionDescription);
}

function handleIceCandidate(event) {
  console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    socket.emit('messageForRoom',{
        username: username,
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function handleSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  //enableMessageInterface(readyState == "open");
}

function handleReceiveChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Receive channel state is: ' + readyState);
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    pc.onicecandidate = handleIceCandidate;
    console.log('Created RTCPeerConnnection with:\n' +
      '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
      '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
  pc.onaddstream = gotRemoteStream;
  pc.onremovestream = handleRemoteStreamRemoved;

  if (isInitiator) {
    try {
      // Reliable Data Channels not yet supported in Chrome
      sendChannel = pc.createDataChannel("sendDataChannel",
        {reliable: false});
      sendChannel.onmessage = handleMessage;
      trace('Created send data channel');
    } catch (e) {
      alert('Failed to create data channel. ' +
            'You need Chrome M25 or later with RtpDataChannel enabled');
      trace('createDataChannel() failed with exception: ' + e.message);
    }
    sendChannel.onopen = handleSendChannelStateChange;
    sendChannel.onclose = handleSendChannelStateChange;
  } else {
    pc.ondatachannel = gotReceiveChannel;
  }
}

function localCall(){
    if (localStream.getVideoTracks().length > 0)trace('Using video device: ' + localStream.getVideoTracks()[0].label);
    if (localStream.getAudioTracks().length > 0)trace('Using audio device: ' + localStream.getAudioTracks()[0].label);
    
    var servers = null;
    
    localPC = new RTCPeerConnection(servers);
    trace("Created local peer connection object localPeerConnection");
    localPC.onicecandidate = gotLocalIceCandidate;
    
    pc = new RTCPeerConnection(servers);
    trace("Created remote peer connection object remotePeerConnection");
    pc.onicecandidate = gotRemoteIceCandidate;
    pc.onaddstream = gotRemoteStream;

    localPC.addStream(localStream);
    trace("Added localStream to localPeerConnection");
    localPC.createOffer(gotLocalDescription,handleError);
}

function gotLocalDescription(description){
  localPC.setLocalDescription(description);
  trace("Offer from localPeerConnection: \n" + description.sdp);
  pc.setRemoteDescription(description);
  pc.createAnswer(gotRemoteDescription,handleError);
}

function gotRemoteDescription(description){
    pc.setLocalDescription(description);
    trace("Answer from remotePeerConnection: \n" + description.sdp);
    localPC.setRemoteDescription(description);
}

function gotLocalIceCandidate(event){
    if (event.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(event.candidate));
        trace("Local ICE candidate: \n" + event.candidate.candidate);
    }
}

function gotRemoteIceCandidate(event){
  if (event.candidate) {
    localPC.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Remote ICE candidate: \n " + event.candidate.candidate);
  }
}


function handleError(){}

function makeVideoActive(videoStream){
    attachMediaStream(activeVideo,videoStream);
}
 
//Fonction appelé par le 'valider' du prompt et de destruction de ce dernier
function validerPassword(Password){
   if(Password != null || Password != ""){
      getSocket().emit('banIP',ip,Password);
      //alert("mot de passe " + Password + " enregistré.");
      var myPrompt = document.getElementById('myPrompt');
      document.body.removeChild(myPrompt);
   }
}

/** Ban Part */
function tryBan(username){
    var promptPassword = prompt("Please enter the administration password","");
    if (promptPassword != null){
        getSocket().emit('banIP',usrname,promptPassword);
    }
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}











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
