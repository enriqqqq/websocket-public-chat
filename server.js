const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const server = new WebSocket.Server({ port: 8080 });

const clients = new Map(); // Map to store client UUID and socket

server.on('connection', (socket) => {
    const id = uuidv4(); // Generate a unique ID
    clients.set(id, socket); // Store the client with its ID
    console.log(`Client connected with ID: ${id}`);

    // Send the unique ID to the client
    socket.send(JSON.stringify({ type: 'welcome', clientId: id }));

    // Handle messages from the client
    socket.on('message', (message) => {
        console.log(`Message from Client ${id}: ${message}`);
        
        const payload = JSON.stringify({
            type: 'broadcast',
            senderId: id,
            message: message.toString(),
        });

        // Broadcast the message to all connected clients
        clients.forEach((clientSocket, clientId) => {
            if (clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(payload);
            }
        });
    });

    // Handle client disconnection
    socket.on('close', () => {
        console.log(`Client ${id} disconnected`);
        clients.delete(id); // Remove the client from the Map
    });
});

console.log('WebSocket server started on ws://localhost:8080');
