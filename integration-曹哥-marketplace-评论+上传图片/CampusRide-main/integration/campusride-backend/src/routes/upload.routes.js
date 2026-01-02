import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { uploadItemMedia, handleUploadError } from '../middleware/upload.middleware.js';
import { uploadFiles } from '../controllers/upload.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/upload:
 *   post:
 *     summary: Upload media files for marketplace items
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Media files (images/videos)
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 uploaded:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       path:
 *                         type: string
 *                       url:
 *                         type: string
 *                       size:
 *                         type: number
 *                       mimetype:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [image, video]
 *                 uploadedCount:
 *                   type: number
 *                 totalFiles:
 *                   type: number
 *       400:
 *         description: Bad request or file validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, uploadItemMedia, handleUploadError, uploadFiles);

export default router;