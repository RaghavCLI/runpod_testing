const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const httpClient = require('../utils/httpClient');

/**
 * Process OCR request
 * - Receives uploaded file
 * - Forwards to OCR service
 * - Returns result and cleans up temp file
 */
const processOCR = async (req, res) => {
  let filePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided. Please upload an image.'
      });
    }

    filePath = req.file.path;
    const model = req.body.model || 'ocr';

    // Validate model parameter
    const validModels = ['ocr', 'ocr2'];
    if (!validModels.includes(model)) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Valid options: ${validModels.join(', ')}`
      });
    }

    console.log(`[OCR] Processing file: ${req.file.originalname}, model: ${model}`);

    // Create form data to send to OCR service
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('model', model);

    // Send request to OCR service
    const response = await httpClient.post('/ocr', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log('[OCR] Processing complete');

    // Return successful response
    return res.status(200).json({
      success: true,
      result: response.data.result
    });

  } catch (error) {
    console.error('[OCR] Error:', error.message);

    // Handle specific error types
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'OCR service is not available. Please ensure the Docker container is running.'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'OCR service timeout. The image may be too large or complex.'
      });
    }

    if (error.response) {
      // OCR service returned an error
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error || 'OCR service error'
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });

  } finally {
    // Clean up: delete temporary file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('[OCR] Temporary file cleaned up');
      } catch (cleanupError) {
        console.error('[OCR] Failed to clean up temp file:', cleanupError.message);
      }
    }
  }
};

/**
 * Health check for OCR service
 */
const checkHealth = async (req, res) => {
  try {
    const response = await httpClient.get('/health');
    return res.status(200).json({
      success: true,
      expressServer: 'healthy',
      ocrService: response.data
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      expressServer: 'healthy',
      ocrService: 'unavailable',
      error: 'OCR service is not reachable'
    });
  }
};

module.exports = {
  processOCR,
  checkHealth
};
