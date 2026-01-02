import { supabaseAdmin } from '../config/database.js';
import { generateUniqueFilename } from '../middleware/upload.middleware.js';

/**
 * Upload files to Supabase Storage
 */
export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'NO_FILES',
        message: 'No files provided for upload'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    const uploadedFiles = [];
    const failedUploads = [];

    // Process each file
    for (const file of req.files) {
      try {
        // Generate unique filename
        const filename = generateUniqueFilename(file.originalname);
        const filePath = `marketplace/${userId}/${filename}`;

        // Upload to Supabase Storage (using avatars bucket temporarily)
        const { data, error } = await supabaseAdmin.storage
          .from('avatars')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (error) {
          console.error('Supabase storage error:', error);
          failedUploads.push({
            filename: file.originalname,
            error: error.message
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('avatars')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          filename: file.originalname,
          path: filePath,
          url: urlData.publicUrl,
          size: file.size,
          mimetype: file.mimetype,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video'
        });

      } catch (fileError) {
        console.error('File upload error:', fileError);
        failedUploads.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    // Return results
    const response = {
      success: true,
      data: uploadedFiles,
      uploadedCount: uploadedFiles.length,
      totalFiles: req.files.length
    };

    if (failedUploads.length > 0) {
      response.failed = failedUploads;
      response.failedCount = failedUploads.length;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({
      error: 'UPLOAD_FAILED',
      message: 'Failed to upload files',
      details: error.message
    });
  }
};

/**
 * Delete file from Supabase Storage
 */
export const deleteFile = async (req, res) => {
  try {
    const { filePath } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    if (!filePath) {
      return res.status(400).json({
        error: 'MISSING_FILE_PATH',
        message: 'File path is required'
      });
    }

    // Verify user owns the file (file should be in their folder)
    if (!filePath.includes(`marketplace/${userId}/`)) {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'You can only delete your own files'
      });
    }

    // Delete from Supabase Storage (using avatars bucket)
    const { error } = await supabaseAdmin.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('File deletion error:', error);
      return res.status(500).json({
        error: 'DELETE_FAILED',
        message: 'Failed to delete file',
        details: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      filePath
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'DELETE_FAILED',
      message: 'Failed to delete file',
      details: error.message
    });
  }
};

/**
 * Get file info from Supabase Storage
 */
export const getFileInfo = async (req, res) => {
  try {
    const { filePath } = req.params;

    if (!filePath) {
      return res.status(400).json({
        error: 'MISSING_FILE_PATH',
        message: 'File path is required'
      });
    }

    // Get file info from Supabase Storage (using avatars bucket)
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      });

    if (error) {
      console.error('Get file info error:', error);
      return res.status(500).json({
        error: 'GET_INFO_FAILED',
        message: 'Failed to get file info',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'FILE_NOT_FOUND',
        message: 'File not found'
      });
    }

    const fileInfo = data[0];

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    res.status(200).json({
      success: true,
      file: {
        name: fileInfo.name,
        size: fileInfo.metadata?.size,
        lastModified: fileInfo.updated_at,
        url: urlData.publicUrl,
        path: filePath
      }
    });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      error: 'GET_INFO_FAILED',
      message: 'Failed to get file info',
      details: error.message
    });
  }
};

export default {
  uploadFiles,
  deleteFile,
  getFileInfo
};