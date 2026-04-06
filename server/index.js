import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load root env variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
// Load server env variables (prioritizes server-specific ones if any)
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { initSocket } from './socket.js';
import { renderApiDocs } from './controllers/docController.js';
import { renderDynamicMeta } from './controllers/metaController.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Global Environment Check for Production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI) console.error('CRITICAL: MONGODB_URI is missing on Vercel.');
  if (!process.env.JWT_SECRET) console.error('CRITICAL: JWT_SECRET is missing on Vercel.');
}

const app = express();

/**
 * Database Connection Middleware (For Serverless resiliency)
 */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ 
      message: 'Database connection failed. Please check server logs.',
      status: 'error'
    });
  }
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ 
  origin: function(origin, callback) {
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Documentation Dashboard (Markdown to HTML)
app.get('/', renderApiDocs);

// Dynamic Shared Link Previews (Metadata Injection)
app.get('/:username/:id', renderDynamicMeta);

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// Start Server Logic
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}] on port ${PORT}`);
  });
  
  // Initialize WebSockets
  initSocket(server, allowedOrigins);
}

export default app;
