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

