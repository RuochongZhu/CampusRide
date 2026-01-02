// System Announcements Controller
import { body, param, validationResult } from 'express-validator';
import announcementService from '../services/announcement.service.js';
import { supabaseAdmin } from '../config/database.js';

// Check if user is admin
async function isAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) return false;
  return data?.role === 'admin' || data?.role === 'moderator';
}

// Create announcement (admin only)
export const createAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const adminId = req.user.userId;

    // Check if user is admin
    if (!(await isAdmin(adminId))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can create announcements'
        }
      });
    }

    const {
      title,
      content,
      announcement_type,
      priority,
      is_pinned,
      target_scope,
      target_activity_ids,
      show_in_notification,
      show_in_activity_chat,
      show_in_dashboard,
      scheduled_until
    } = req.body;

    const result = await announcementService.createAnnouncement({
      admin_id: adminId,
      title,
      content,
      announcement_type,
      priority,
      is_pinned,
      target_scope,
      target_activity_ids,
      show_in_notification,
      show_in_activity_chat,
      show_in_dashboard,
      scheduled_until
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ANNOUNCEMENT_CREATION_FAILED',
          message: result.error
        }
      });
    }

    res.status(201).json({
      success: true,
      data: result.announcement
    });

  } catch (error) {
    console.error('❌ Create announcement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create announcement'
      }
    });
  }
};

// Get active announcements
export const getAnnouncements = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await announcementService.getActiveAnnouncements(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        announcements: result.announcements,
        count: result.count
      }
    });

  } catch (error) {
    console.error('❌ Get announcements error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch announcements'
      }
    });
  }
};

// Update announcement (admin only)
export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const adminId = req.user.userId;

    // Check if user is admin
    if (!(await isAdmin(adminId))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can update announcements'
        }
      });
    }

    // Check announcement ownership
    const { data: announcement, error: fetchError } = await supabaseAdmin
      .from('system_announcements')
      .select('admin_id')
      .eq('id', announcementId)
      .single();

    if (fetchError || !announcement) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Announcement not found'
        }
      });
    }

    // Update announcement
    const { data, error } = await supabaseAdmin
      .from('system_announcements')
      .update(req.body)
      .eq('id', announcementId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message
        }
      });
    }

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Update announcement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update announcement'
      }
    });
  }
};

// Delete announcement (admin only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const adminId = req.user.userId;

    // Check if user is admin
    if (!(await isAdmin(adminId))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can delete announcements'
        }
      });
    }

    const result = await announcementService.deleteAnnouncement(announcementId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: result.error
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete announcement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete announcement'
      }
    });
  }
};

// Pin/unpin announcement (admin only)
export const toggleAnnouncementPin = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { is_pinned } = req.body;
    const adminId = req.user.userId;

    // Check if user is admin
    if (!(await isAdmin(adminId))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can pin announcements'
        }
      });
    }

    const result = await announcementService.updateAnnouncementPin(announcementId, is_pinned);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: result.error
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.announcement
    });

  } catch (error) {
    console.error('❌ Toggle pin error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update announcement'
      }
    });
  }
};

// Validation rules
export const createAnnouncementValidation = [
  body('title').isString().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('content').isString().trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
  body('announcement_type').optional().isIn(['general', 'warning', 'important', 'maintenance']),
  body('priority').optional().isInt({ min: 0, max: 100 }),
  body('is_pinned').optional().isBoolean(),
  body('target_scope').optional().isIn(['all', 'activity_only', 'specific_users']),
  body('target_activity_ids').optional().isArray(),
  body('show_in_notification').optional().isBoolean(),
  body('show_in_activity_chat').optional().isBoolean(),
  body('show_in_dashboard').optional().isBoolean(),
  body('scheduled_until').optional().isISO8601()
];

export const updateAnnouncementValidation = [
  body('title').optional().isString().trim().isLength({ min: 5, max: 200 }),
  body('content').optional().isString().trim().isLength({ min: 10, max: 5000 }),
  body('announcement_type').optional().isIn(['general', 'warning', 'important', 'maintenance']),
  body('priority').optional().isInt({ min: 0, max: 100 }),
  body('is_pinned').optional().isBoolean(),
  body('scheduled_until').optional().isISO8601()
];

export const togglePinValidation = [
  body('is_pinned').isBoolean().withMessage('is_pinned must be boolean')
];
