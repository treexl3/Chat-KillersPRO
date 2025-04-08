const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ✅ Allow GitHub Pages to access the backend
app.use(cors({
  origin: 'https://treexl3.github.io'
}));

// ✅ Setup Socket.IO with CORS for GitHub Pages
const socketio = require('socket.io');
const io = socketio(server, {
  cors: {
    origin: 'https://treexl3.github.io',
    methods: ['GET', 'POST']
  }
});

// Helper function to format time for Finland timezone (EET/EEST)
function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString('fi-FI', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Helsinki'
  });
}

// Serve static files from root
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

const users = {};
const chatMessages = document.getElementById('chat-messages');

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };

    // Format system messages with timestamp
    const systemMessage = `<div class="system-message">
      <span class="time">[${formatTime()}]</span> 
      <span class="text">${username} has joined the room.</span>
    </div>`;

    socket.to(room).emit('message', systemMessage);

    const welcomeMessage = `<div class="system-message">
      <span class="time">[${formatTime()}]</span> 
      <span class="text">Welcome to the room: ${room}</span>
    </div>`;

    socket.emit('message', welcomeMessage);

    io.to(room).emit('roomUsers', getUsersInRoom(room));
  });
  socket.on('chatMessage', msg => {
    const user = users[socket.id];
    if (user) {
      // Format user messages with timestamp and username
      const formattedMessage = `<div class="user-message">
        <span class="time">[${formatTime()}]</span> 
        <span class="username">${user.username}:</span> 
        <span class="text">${msg}</span>
      </div>`;

      chatMessages.scrollTop = chatMessages.scrollHeight;
      io.to(user.room).emit('message', formattedMessage);
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const leaveMessage = `<div class="system-message">
        <span class="time">[${formatTime()}]</span> 
        <span class="text">${user.username} has left the room.</span>
      </div>`;

      io.to(user.room).emit('message', leaveMessage);
      delete users[socket.id];
      io.to(user.room).emit('roomUsers', getUsersInRoom(user.room));
    }
  });
});

function getUsersInRoom(room) {
  return Object.values(users)
    .filter(user => user.room === room)
    .map(user => user.username);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));