import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Load env variables
dotenv.config();

// Connect to database
connectDB();

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/admin', adminRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('THE ULTIMATE SONGS API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// Only listen if not running in a serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running in http://localhost:${PORT} ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;

