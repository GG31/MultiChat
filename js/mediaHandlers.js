function handleUserMedia(stream) {
  setLocalStream(stream);
  attachMediaStream(getLocalVideo(), stream);
  console.log('Adding local stream.');

  // On envoie un message à tout le monde disant qu'on a bien
  // overt la connexion video avec la web cam.
  sendMessage('got user media');

  // Si on est l'appelant on essaie d'ouvrir la connexion p2p
  /*
  if (getIsInitiator()) {
    maybeStart();
  }
  */
}

function handleUserMediaError(error){
  console.log('getUserMedia error: ', error);
}
