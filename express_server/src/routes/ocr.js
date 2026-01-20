const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ocrController = require('../controllers/ocrController');

/**
 * POST /api/ocr
 * Upload an image and get OCR results
 * 
 * Body (multipart/form-data):
 *   - image: Image file (required)
 *   - model: 'ocr' or 'ocr2' (optional, default: 'ocr')
 * 
 * Response:
 *   - success: boolean
 *   - result: OCR results array (on success)
 *   - error: Error message (on failure)
 */
router.post('/', upload.single('image'), ocrController.processOCR);

/**
 * GET /api/ocr/health
 * Check health of both Express server and OCR service
 */
router.get('/health', ocrController.checkHealth);

module.exports = router;
