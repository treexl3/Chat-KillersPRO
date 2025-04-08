const socket = io('https://829fb174-f9f6-4ee6-9042-89f12efe6cea-00-n3irp254sj1g.spock.replit.dev/');
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const room = urlParams.get('room');

// Function to display messages
function displayMessage(message, saveToStorage = true) {
  const div = document.createElement('div');
  div.classList.add('message');
  
  // Use innerHTML to properly render the HTML
  div.innerHTML = message;
  document.getElementById('messages').appendChild(div);
  
  // Auto-scroll to bottom
  const messagesContainer = document.getElementById('messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Save message to local storage only if flag is true
  if (saveToStorage) {
    saveMessageToStorage(message);
  }
}

// Function to save messages to local storage
function saveMessageToStorage(message) {
  const roomKey = `messages-${room}`;
  let messages = JSON.parse(localStorage.getItem(roomKey) || '[]');
  
  // Don't save duplicate welcome messages
  if (message.includes("Welcome to the room:")) {
    // Check if we already have a welcome message in storage
    const hasWelcomeMessage = messages.some(msg => msg.includes("Welcome to the room:"));
    if (hasWelcomeMessage) {
      return; // Skip saving this welcome message
    }
  }
  
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
  
  // Flag to track if we've shown the welcome message
  let hasWelcomeMessage = false;
  
  messages.forEach(message => {
    // If this is a welcome message and we've already shown one, skip it
    if (message.includes("Welcome to the room:")) {
      if (hasWelcomeMessage) {
        return;
      }
      hasWelcomeMessage = true;
    }
    
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
  // For welcome messages, don't save to storage again if it's for the current user
  const isWelcomeMessage = messageData.includes("Welcome to the room:");
  displayMessage(messageData, !isWelcomeMessage);
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