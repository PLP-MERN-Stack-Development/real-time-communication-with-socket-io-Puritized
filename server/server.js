// server.js — Socket.io Chat Server (Persistent Messages)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const messagesFile = path.join(__dirname, 'messages.json');
let messages = [];
const users = {};
const typingUsers = {};

// Load messages from file on startup
if (fs.existsSync(messagesFile)) {
  try {
    const data = fs.readFileSync(messagesFile, 'utf8');
    messages = JSON.parse(data);
    console.log(`Loaded ${messages.length} messages from messages.json`);
  } catch (err) {
    console.error('Error reading messages.json:', err);
  }
}

// Helper: save messages to file
function saveMessages() {
  fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), (err) => {
    if (err) console.error('Error saving messages.json:', err);
  });
}

// ========== SOCKET.IO EVENTS ==========
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // --- User joins ---
  socket.on('user_join', (username) => {
    users[socket.id] = { username, id: socket.id };
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
    console.log(`👤 ${username} joined the chat`);
  });

  // --- Chat message ---
  socket.on('send_message', (data) => {
    const user = users[socket.id];
    if (!user) return;

    const message = {
      id: Date.now(),
      sender: user.username,
      senderId: socket.id,
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);
    if (messages.length > 500) messages.shift(); // limit size
    saveMessages();

    io.emit('receive_message', message);
    console.log(`💬 ${user.username}: ${data.message}`);
  });

  // --- Typing indicator ---
  socket.on('typing', (isTyping) => {
    const user = users[socket.id];
    if (!user) return;

    if (isTyping) typingUsers[socket.id] = user.username;
    else delete typingUsers[socket.id];

    io.emit('typing_users', Object.values(typingUsers));
  });

  // --- Private messages ---
  socket.on('private_message', ({ to, message }) => {
    const sender = users[socket.id];
    if (!sender) return;

    const messageData = {
      id: Date.now(),
      sender: sender.username,
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };

    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
    console.log(`📩 Private message from ${sender.username} to ${to}`);
  });

  // --- User disconnects ---
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      io.emit('user_left', { username: user.username, id: socket.id });
      console.log(`❌ ${user.username} disconnected`);
    }

    delete users[socket.id];
    delete typingUsers[socket.id];

    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// ========== REST API ==========
app.get('/api/messages', (req, res) => res.json(messages));
app.get('/api/users', (req, res) => res.json(Object.values(users)));
app.get('/', (req, res) => res.send('🚀 Socket.io Chat Server is running...'));

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));

module.exports = { app, server, io };