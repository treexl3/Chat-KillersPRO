const socket = io('https://chat-killerspro.onrender.com');
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const room = urlParams.get('room');

socket.on('message', messageData => {
  const isWelcomeMessage = messageData.includes('Welcome to the room:');

  // Prevent duplicate welcome message
  if (isWelcomeMessage && document.querySelector('.welcome-message')) {
    return;
  }

  displayMessage(messageData, isWelcomeMessage);
});

// Function to display messages
function displayMessage(message, isWelcome = false) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = message;

  // Add class if it's a welcome message
  if (isWelcome) {
    div.classList.add('welcome-message');
    // Insert at top of message list
    document.getElementById('messages').insertBefore(div, document.getElementById('messages').firstChild);
  } else {
    document.getElementById('messages').appendChild(div);
  }

  // Auto-scroll to bottom (but not for welcome message)
  if (!isWelcome) {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Save to storage (optional — skip for welcome if you want)
  if (!isWelcome) saveMessageToStorage(message);
}


// Function to save messages to local storage
function saveMessageToStorage(message) {
  const roomKey = `messages-${room}`;
  let messages = JSON.parse(localStorage.getItem(roomKey) || '[]');
  messages.push(message);

  // Keep only the last 100 messages
  if (messages.length > 100) {
    messages = messages.slice(messages.length - 100);
  }

  localStorage.setItem(roomKey, JSON.stringify(messages));
}

// Function to load messages from storage
function loadMessagesFromStorage() {
  const roomKey = `messages-${room}`;
  const messages = JSON.parse(localStorage.getItem(roomKey) || '[]');

  messages.forEach(message => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = message;
    document.getElementById('messages').appendChild(div);
  });

  // Auto-scroll to bottom
  const messagesContainer = document.getElementById('messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

if (username && room) {
  socket.emit('joinRoom', { username, room });
  document.getElementById('room-name').innerText = `Room: ${room}`;

  // Load existing messages
  loadMessagesFromStorage();
}

socket.on('message', messageData => {
  displayMessage(messageData);
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