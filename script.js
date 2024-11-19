const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');

let localStream;
let remoteStream;
let peerConnection;
const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// Initialize Socket.io
const socket = io();

// Request access to the camera and microphone
async function startVideoCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(servers);
        
        // Add local tracks to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Listen for remote track
        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };

        // Create offer and send it to the other client
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);

    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

function endVideoCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

// Listen for offers and answers from the signaling server
socket.on('offer', async (offer) => {
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(servers);
        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        };
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer);
    }
});

socket.on('answer', answer => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', candidate => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

startCallButton.addEventListener('click', startVideoCall);
endCallButton.addEventListener('click', endVideoCall);
