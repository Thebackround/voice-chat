pip node.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Initialize the app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (e.g., your HTML, CSS, and JS files)
app.use(express.static(__dirname));

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Listen for 'offer' messages
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    // Listen for 'answer' messages
    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    // Listen for 'ice-candidate' messages
    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected: ' + socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
