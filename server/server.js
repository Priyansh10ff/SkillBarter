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

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your Client URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());
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