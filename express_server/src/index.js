require('dotenv').config();

const express = require('express');
const cors = require('cors');
const config = require('./config');
const ocrRoutes = require('./routes/ocr');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/ocr', ocrRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Express OCR Server',
    version: '1.0.0',
    endpoints: {
      'POST /api/ocr': 'Upload image for OCR processing',
      'GET /api/ocr/health': 'Check service health'
    }
  });
});

// Error handling middleware for multer errors
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Generic error handler
  console.error('[Error]', err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(config.port, () => {
  console.log('='.repeat(50));
  console.log(`Express OCR Server started`);
  console.log(`Port: ${config.port}`);
  console.log(`OCR Service URL: ${config.ocrServiceUrl}`);
  console.log('='.repeat(50));
  console.log('Endpoints:');
  console.log(`  POST http://localhost:${config.port}/api/ocr`);
  console.log(`  GET  http://localhost:${config.port}/api/ocr/health`);
  console.log('='.repeat(50));
});
