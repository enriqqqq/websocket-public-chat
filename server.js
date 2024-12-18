const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const server = new WebSocket.Server({ port: 8080 });

const clients = new Map(); // Map to store client UUID and socket

function broadcastConnectedClients() {
    // Get a list of all connected client IDs
    const connectedClientIds = Array.from(clients.keys());

    // Prepare the broadcast message
    const payload = JSON.stringify({
        type: 'connectedClients',
        clientIds: connectedClientIds,
    });

    // Broadcast to all connected clients
    clients.forEach((clientSocket) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(payload);
        }
    });
}

server.on('connection', (socket) => {
    const id = uuidv4(); // Generate a unique ID
    clients.set(id, socket); // Store the client with its ID
    console.log(`Client connected with ID: ${id}`);

    // Send the unique ID to the client
    socket.send(JSON.stringify({ type: 'welcome', clientId: id }));

    // Broadcast the list of connected clients to all clients
    broadcastConnectedClients();

    // Handle messages from the client
    socket.on('message', (message) => {
        console.log(`Message from Client ${id}: ${message}`);
        let parsedMessage

        // try to parse into JSON
        try {
            parsedMessage = JSON.parse(message)
        } catch (error) {
            parsedMessage = null;
        }

        if(parsedMessage) {
            const { type, recipientId, message } = parsedMessage;
            if(type === 'private' && recipientId) {
                const receiverSocket = clients.get(recipientId);
                if(receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
                    const payload = JSON.stringify({
                        type: 'private',
                        senderId: id,
                        message: message.toString(),
                    });
                    receiverSocket.send(payload);
                }
            }
        }
        else {
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
        }
    });

    // Handle client disconnection
    socket.on('close', () => {
        console.log(`Client ${id} disconnected`);
        clients.delete(id); // Remove the client from the Map

        // Broadcast the list of connected clients to all clients
        broadcastConnectedClients();
    });
});

console.log('WebSocket server started on ws://localhost:8080');
