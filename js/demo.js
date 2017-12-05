var client, localStream, camera, microphone;
var streams = [];
var curStream = null;
//var audioSelect = document.querySelector('select#audioSource');
//var videoSelect = document.querySelector('select#videoSource');

function join() {
  //document.getElementById("join").disabled = true;
  //document.getElementById("video").disabled = true;
  var channel_key = null;

  //console.log("Init AgoraRTC client with vendor key: " + key.value);
  client = AgoraRTC.createClient({mode: 'interop'});
  client.init('959cbe4f123e49339a44820464b596cd', function () {
    console.log("AgoraRTC client initialized");
    client.join(channel_key, 'wawaji-beijing-00010001-camera', null, function(uid) {
      console.log("User " + uid + " join channel successfully");

     /* if (document.getElementById("video").checked) {
        camera = videoSource.value;
        microphone = audioSource.value;
        localStream = AgoraRTC.createStream({streamID: uid, audio: false, cameraId: camera, microphoneId: null, video: document.getElementById("video").checked, screen: false});
        //localStream = AgoraRTC.createStream({streamID: uid, audio: false, cameraId: camera, microphoneId: microphone, video: false, screen: true, extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg'});
        if (document.getElementById("video").checked) {
          //localStream.setVideoProfile('720p_3');
			localStream.setVideoProfile('360p');
		}
        localStream.init(function() {
          console.log("getUserMedia successfully");
          localStream.play('agora_local');

          client.publish(localStream, function (err) {
            console.log("Publish local stream error: " + err);
          });

          client.on('stream-published', function (evt) {
            console.log("Publish local stream successfully");
          });
        }, function (err) {
          console.log("getUserMedia failed", err);
        });
      }*/
    }, function(err) {
      console.log("Join channel failed", err);
    });
  }, function (err) {
    console.log("AgoraRTC client init failed", err);
  });

  channelKey = "";
  client.on('error', function(err) {
    console.log("Got error msg:", err.reason);
    if (err.reason === 'DYNAMIC_KEY_TIMEOUT') {
      client.renewChannelKey(channelKey, function(){
        console.log("Renew channel key successfully");
      }, function(err){
        console.log("Renew channel key failed: ", err);
      });
    }
  });


  client.on('stream-added', function (evt) {
    var stream = evt.stream;
    console.log("New stream added: " + stream.getId());
    console.log("Subscribe ", stream);
    client.subscribe(stream, function (err) {
      console.log("Subscribe stream failed", err);
    });
  });

  
  client.on('stream-subscribed', function (evt) {
    var stream = evt.stream;
    console.log("Subscribe remote stream successfully: " + stream.getId());
    /*if ($('div#video #agora_remote'+stream.getId()).length === 0) {
      $('div#video').append('<div id="agora_remote'+stream.getId()+'" style="float:left; width:810px;height:607px;display:inline-block;"></div>');
    }*/
    if (streams.length == 0) {
      curStream = stream;
      var div = document.createElement('div');
      document.getElementById('live').appendChild(div);
      div.id = 'agora_remote';
      div.className = 'video';
      stream.play('agora_remote');
    }
    streams.push(stream);
  });


  client.on('stream-removed', function (evt) {
    var stream = evt.stream;
    stream.stop();
    $('#agora_remote' + stream.getId()).remove();
    console.log("Remote stream is removed " + stream.getId());
  });

  client.on('peer-leave', function (evt) {
    var stream = evt.stream;
    if (stream) {
      stream.stop();
      $('#agora_remote' + stream.getId()).remove();
      console.log(evt.uid + " leaved from this channel");
    }
  });
}

function toggleCamera() {
  var s = null;
  for (var i = 0; i < streams.length; i ++) {
    if (streams[i] != curStream) {
      s = streams[i];
      break;
    }
  }
  if (curStream)
    curStream.stop();
  if (s) {
    curStream = s;
    curStream.play('agora_remote');
  }
}
join();