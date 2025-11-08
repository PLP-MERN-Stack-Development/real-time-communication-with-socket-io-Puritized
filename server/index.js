const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // in dev allow all origins; refine in production
});

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Listen for a join event (optional)
  socket.on('join', ({ username }) => {
    socket.username = username || 'Anonymous';
    console.log(`${socket.username} joined with id ${socket.id}`);
    // Broadcast to others that a user joined
    socket.broadcast.emit('user-joined', { id: socket.id, username: socket.username });
  });

  // Listen for chat message events
  socket.on('chat-message', (msg) => {
    // Attach metadata server-side if desired
    const payload = {
      id: socket.id,
      username: socket.username || 'Anonymous',
      message: msg,
      timestamp: new Date().toISOString()
    };
    // Emit to all clients (including sender)
    io.emit('chat-message', payload);
  });

  // Typing indicator
  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', { id: socket.id, username: socket.username, isTyping });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
    // Inform others
    socket.broadcast.emit('user-left', { id: socket.id, username: socket.username });
  });
});

app.get('/', (req, res) => res.send('Realtime Chat Server is running'));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));