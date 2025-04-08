const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

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

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };

    socket.to(room).emit('message', `${username} has joined the room.`);
    socket.emit('message', `Welcome to the room: ${room}`);

    io.to(room).emit('roomUsers', getUsersInRoom(room));
  });

  socket.on('chatMessage', msg => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('message', `${user.username}: ${msg}`);
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('message', `${user.username} has left the room.`);
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
