const axios = require('axios');
const config = require('../config');

// Create axios instance with default config
const httpClient = axios.create({
  baseURL: config.ocrServiceUrl,
  timeout: 60000, // 60 seconds timeout for OCR processing
  headers: {
    'Accept': 'application/json'
  }
});

// Request interceptor for logging
httpClient.interceptors.request.use(
  (requestConfig) => {
    console.log(`[HTTP] ${requestConfig.method.toUpperCase()} ${requestConfig.baseURL}${requestConfig.url}`);
    return requestConfig;
  },
  (error) => {
    console.error('[HTTP] Request error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
httpClient.interceptors.response.use(
  (response) => {
    console.log(`[HTTP] Response: ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[HTTP] Response error: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      console.error('[HTTP] No response received:', error.message);
    } else {
      console.error('[HTTP] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

module.exports = httpClient;
