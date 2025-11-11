import jwt from 'jsonwebtoken';
import { AppError, ERROR_CODES } from './error.middleware.js';
import { supabaseAdmin } from '../config/database.js';

// JWT认证中间件
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      throw new AppError('Access token required', 401, ERROR_CODES.TOKEN_INVALID);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle guest tokens
    if (decoded.type === 'guest') {
      req.user = {
        id: 'guest',
        email: 'guest@example.com',
        first_name: 'Guest',
        last_name: 'User',
        student_id: 'guest',
        university: 'Cornell University',
        role: 'guest',
        is_active: true,
        isGuest: true
      };
      return next();
    }
    
    // Get user from database to ensure user still exists
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, student_id, first_name, last_name, university, role, is_verified, is_active')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // 检查账户是否激活
    if (user.is_active === false) {
      throw new AppError('Account is disabled', 401, ERROR_CODES.ACCESS_DENIED);
    }

    // 检查账户验证状态
    if (!user.is_verified) {
      throw new AppError('Account is not verified', 401, ERROR_CODES.ACCESS_DENIED);
    }

    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401, ERROR_CODES.TOKEN_INVALID));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401, ERROR_CODES.TOKEN_EXPIRED));
    } else {
      next(error);
    }
  }
};

// 可选认证中间件 - 如果有token则验证，没有则继续但不设置用户
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // 没有token，继续但不设置用户
      return next();
    }

    // 有token，尝试验证
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Handle guest tokens
      if (decoded.type === 'guest') {
        req.user = {
          id: 'guest',
          email: 'guest@example.com',
          first_name: 'Guest',
          last_name: 'User',
          student_id: 'guest',
          university: 'Cornell University',
          role: 'guest',
          isGuest: true
        };
        return next();
      }
      
      // Get user from database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, student_id, first_name, last_name, university, role, is_verified, is_active')
        .eq('id', decoded.userId)
        .single();

      if (!error && user && user.is_verified && user.is_active !== false) {
        req.user = user;
      }
      
      next();
    } catch (tokenError) {
      // Token无效，继续但不设置用户
      next();
    }
  } catch (error) {
    next();
  }
};

// 权限检查中间件
export const checkPermission = (requiredRole = 'user') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, ERROR_CODES.ACCESS_DENIED);
      }

      const userRole = req.user.role || 'user';
      const roleHierarchy = ['user', 'moderator', 'admin'];
      
      const userRoleIndex = roleHierarchy.indexOf(userRole);
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

      if (userRoleIndex < requiredRoleIndex) {
        throw new AppError('Insufficient permissions', 403, ERROR_CODES.ACCESS_DENIED);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 防止游客用户创建内容的中间件
export const requireRegisteredUser = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, ERROR_CODES.ACCESS_DENIED);
    }

    if (req.user.role === 'guest' || req.user.isGuest) {
      throw new AppError('Registered users only. Please create an account to perform this action.', 403, ERROR_CODES.ACCESS_DENIED);
    }

    next();
  } catch (error) {
    next(error);
  }
}; 