import { WebSocketServer } from 'ws';
const port = Number(process.env.PORT) || 8081;
const server = new WebSocketServer({
    port,
});
server.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('message', (message) => {
        console.log(`Received: ${message}`);
        socket.send(`Server: connected`);
    });
    socket.on('close', () => {
        console.log('Client disconnected');
    });
});
console.log(`WebSocket server is running on ${port}`);
