import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';
import crypto from 'crypto';

// Upload image for marketplace items
export const uploadImage = async (req, res, next) => {
  try {
    const { image, filename, itemType = 'marketplace' } = req.body;
    const userId = req.user.id;

    if (!image) {
      throw new AppError('Image data is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // Handle both string and object types
    let imageData = image;
    if (typeof image === 'object') {
      imageData = image.toString();
    }

    // Validate image format (base64)
    if (!imageData.startsWith('data:image/')) {
      throw new AppError('Invalid image format. Please provide a valid image.', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Extract image type and data
    const matches = imageData.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
    if (!matches) {
      throw new AppError('Invalid image format', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const imageType = matches[1];
    const base64Data = matches[2];

    // Validate image type
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedTypes.includes(imageType.toLowerCase())) {
      throw new AppError('Unsupported image type. Allowed types: JPEG, PNG, WebP', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Generate unique filename
    const fileExtension = imageType.toLowerCase() === 'jpeg' ? 'jpg' : imageType.toLowerCase();
    let baseName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : '';
    if (baseName && baseName.toLowerCase().endsWith(`.${fileExtension}`)) {
      baseName = baseName.slice(0, -(`.${fileExtension}`.length));
    }
    const uniqueFilename = baseName
      ? `${userId}_${baseName}.${fileExtension}`
      : `${userId}_${crypto.randomUUID()}.${fileExtension}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      throw new AppError('Image size must be less than 5MB', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Upload to Supabase Storage
    const bucketName = itemType === 'marketplace' ? 'marketplace-images' : 'uploads';

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError && createError.message !== 'Bucket already exists') {
        console.error('Failed to create bucket:', createError);
        throw new AppError('Failed to initialize storage', 500, ERROR_CODES.UPLOAD_ERROR, createError);
      }
    }

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(uniqueFilename, buffer, {
        contentType: `image/${imageType}`,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new AppError('Failed to upload image', 500, ERROR_CODES.UPLOAD_ERROR, uploadError);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(uniqueFilename);

    if (!urlData?.publicUrl) {
      throw new AppError('Failed to generate public URL', 500, ERROR_CODES.UPLOAD_ERROR);
    }

    res.status(201).json({
      success: true,
      data: {
        filename: uniqueFilename,
        url: urlData.publicUrl,
        path: uploadData.path,
        bucket: bucketName
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete image from storage
export const deleteImage = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const { bucket = 'marketplace-images' } = req.query;

    if (!filename) {
      throw new AppError('Filename is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filename]);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      throw new AppError('Failed to delete image', 500, ERROR_CODES.DELETE_ERROR, deleteError);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Legacy upload handler (kept for compatibility)
export const upload = (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Legacy upload endpoint. Use /upload/image instead.',
      code: 'DEPRECATED'
    }
  });
};

export default {
  upload,
  uploadImage,
  deleteImage
};
