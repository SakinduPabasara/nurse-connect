import io from 'socket.io-client';

// We want to connect to the same host that the API uses.
// For local dev, Vite runs on 5173 and backend on 5000.
// Let's rely on the environment variable or construct it from window.location.
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
