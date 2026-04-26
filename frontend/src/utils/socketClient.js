import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://127.0.0.1:5000';

let socket = null;
let currentToken = null;

export const connectSocket = (token) => {
  // If socket already exists and token hasn't changed, just return it
  if (socket && currentToken === token && socket.connected) {
    return socket;
  }

  // Disconnect existing if token changed or it was dead
  if (socket) {
    socket.disconnect();
  }
  
  currentToken = token;
  
  // Starting with polling followed by websocket is the recommended way
  // to avoid "WebSocket connection failed" errors during the initial handshake.
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'], 
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};
