require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  ocrServiceUrl: process.env.OCR_SERVICE_URL || 'http://localhost:5000'
};

module.exports = config;
