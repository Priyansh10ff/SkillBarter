const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Get Client URL from Env Variables (Set this in Render!)
// Fallback to localhost array for local development
const allowedOrigins = [
  process.env.CLIENT_URL,       // The Vercel URL
  "http://localhost:5173",      // Vite Local Dev
  "http://localhost:5000"       // Postman/Backend testing
].filter(Boolean); // Remove undefined values if env var is missing

// 1. Setup Socket.io with Dynamic CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 2. Setup Express CORS (Matches Socket.io)
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// Socket Logic
io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  // User joins their own personal room (based on User ID)
  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });

  // Call Signaling
  socket.on('call_user', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('call_user', { signal: signalData, from, name });
  });

  socket.on('answer_call', (data) => {
    io.to(data.to).emit('call_accepted', data.signal);
  });
  
  socket.on('reject_call', (data) => {
    io.to(data.to).emit('call_rejected');
  });

  // Whiteboard Drawing Sync
  socket.on('draw', ({ roomId, data }) => {
    socket.to(roomId).emit('draw', data);
  });
  
  socket.on('join_room', (roomId) => {
      socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));