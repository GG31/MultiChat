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
}

function makeVideoActive(videoStream){
    attachMediaStream(activeVideo,videoStream);
}

function gotRemoteStream(event){
    streamList[idVid] = event.stream;
    var text = "<div class='profil'><span class='color4'>USERNAME</span><img class='image-delete' src='images/croix.png' title='delete' onclick='tryBan(\"USERNAME\");'><video id='streamVid_"+idVid+"' class='remoteVideo' onclick='makeVideoActive(streamList["+idVid+"]);' autoplay></video></div>";
    text += "<script>var element = document.querySelector('#streamVid_"+idVid+"');attachMediaStream(element,streamList["+idVid+"]);</script>";
    idVid += 1;
    
    $('#profils-container').append(text);
}

function call(){
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