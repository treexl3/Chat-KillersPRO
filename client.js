const socket = io('https://829fb174-f9f6-4ee6-9042-89f12efe6cea-00-n3irp254sj1g.spock.replit.dev/');
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const room = urlParams.get('room');

if (username && room) {
  socket.emit('joinRoom', { username, room });
  document.getElementById('room-name').innerText = `Room: ${room}`;
}

socket.on('message', message => {
  const div = document.createElement('div');
  div.textContent = message;
  document.getElementById('messages').appendChild(div);
});

socket.on('roomUsers', users => {
  const userList = document.getElementById('user-list');
  userList.innerHTML = `<strong>Users in room:</strong><br>${users.join('<br>')}`;
});

document.getElementById('message-form').addEventListener('submit', e => {
  e.preventDefault();
  const msgInput = document.getElementById('msg');
  const msg = msgInput.value;
  socket.emit('chatMessage', msg);
  msgInput.value = '';
});