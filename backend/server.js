require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const moderationRoutes = require('./routes/moderation');
const adminRoutes = require('./routes/admin');
const { apiLimiter } = require('./middleware/rateLimiter');
const { startAIWorker } = require('./workers/aiWorker');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  // Enforce native websockets in production to avoid long-polling overhead/failures
  transports: ['websocket'] 
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);

// Health check — includes Redis/Queue status
app.get('/api/health', async (req, res) => {
  const { isQueueReady } = require('./queues/aiQueue');
  res.json({
    status:      'OK',
    timestamp:   new Date().toISOString(),
    ai:          process.env.AI_PROVIDER || 'rule-based',
    queue:       isQueueReady() ? 'connected' : 'unavailable (inline fallback active)',
    openai:      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
                   ? 'configured'
                   : 'not configured (rule-based fallback active)'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // User joins their personal room for real-time notifications
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`[Socket] User ${userId} joined room user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Attach io to app so controllers can emit events
app.set('io', io);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);

  // Start the AI background worker (in-process, shares io)
  startAIWorker(io);
  console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'rule-based'}`);
  console.log(`📦 Queue: BullMQ → Redis ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
});
