import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import restroomRoutes from './routes/restrooms';
import commentRoutes from './routes/comments';
import friendRoutes from './routes/friends';
import uploadRoutes from './routes/upload';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
// Use path.resolve to handle both development and production modes
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
console.log('📁 Uploads directory:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restrooms', restroomRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NTU Restroom Map API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
  console.log(`🗺️  NTU Restroom Map Backend is ready!`);
});

export default app;
