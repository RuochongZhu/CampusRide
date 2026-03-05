import jwt from 'jsonwebtoken';

// JWT secret key - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          }
        });
      }

      // Normalize common payload shapes so downstream controllers can rely on req.user.id
      const normalizedUser = {
        ...user,
        id: user.id || user.userId || user.sub,
        userId: user.userId || user.id || user.sub
      };

      // Guard against tokens without any usable identifier
      if (!normalizedUser.id) {
        console.error('JWT payload missing user identifier:', user);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Invalid token payload',
            code: 'INVALID_TOKEN_PAYLOAD'
          }
        });
      }

      req.user = normalizedUser;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Optional authentication middleware - continues even without token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        req.user = null;
      } else {
        const normalizedUser = {
          ...user,
          id: user.id || user.userId || user.sub,
          userId: user.userId || user.id || user.sub
        };
        req.user = normalizedUser.id ? normalizedUser : null;
      }
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Generate JWT token
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded user data or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export default {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken
};
