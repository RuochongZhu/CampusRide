// System Announcements Routes
import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPin,
  createAnnouncementValidation,
  updateAnnouncementValidation,
  togglePinValidation
} from '../controllers/announcement.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/announcements - Get active announcements (public)
router.get('/', getAnnouncements);

// POST /api/v1/announcements - Create announcement (admin only)
router.post('/',
  createAnnouncementValidation,
  createAnnouncement
);

// PUT /api/v1/announcements/:announcementId - Update announcement (admin only)
router.put('/:announcementId',
  updateAnnouncementValidation,
  updateAnnouncement
);

// DELETE /api/v1/announcements/:announcementId - Delete announcement (admin only)
router.delete('/:announcementId', deleteAnnouncement);

// POST /api/v1/announcements/:announcementId/pin - Pin/unpin announcement (admin only)
router.post('/:announcementId/pin',
  togglePinValidation,
  toggleAnnouncementPin
);

export default router;
