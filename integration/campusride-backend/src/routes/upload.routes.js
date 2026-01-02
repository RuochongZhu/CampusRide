import express from 'express';
import { upload, uploadImage, deleteImage } from '../controllers/upload.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Upload single image (placeholder implementation)
router.post('/image', authenticateToken, uploadImage);

// Delete image (placeholder implementation)
router.delete('/image/:filename', authenticateToken, deleteImage);

export default router;
