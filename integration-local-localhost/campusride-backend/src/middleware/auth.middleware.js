import jwt from 'jsonwebtoken';
import { AppError, ERROR_CODES } from './error.middleware.js';
import { supabaseAdmin } from '../config/database.js';

const shouldLogAuthDebug = process.env.AUTH_DEBUG === 'true' && process.env.NODE_ENV !== 'test';

// JWT认证中间件 - 严格模式，只允许已注册且验证的用户
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token required', 401, ERROR_CODES.TOKEN_INVALID);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 DEBUG: 添加详细的Token解析日志
    if (shouldLogAuthDebug) {
      console.log('🔑 Token解析成功:', {
        userId: decoded.userId,
        type: decoded.type,
        iat: decoded.iat,
        exp: decoded.exp,
        iatTime: new Date(decoded.iat * 1000).toISOString(),
        expTime: new Date(decoded.exp * 1000).toISOString(),
        now: new Date().toISOString()
      });
    }

    // Handle guest tokens - 游客模式仍然支持，但明确标记
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

    // 验证用户是否存在 - 不再自动创建临时用户
    if (shouldLogAuthDebug) {
      console.log('🔍 查询用户:', decoded.userId);
    }
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, student_id, first_name, last_name, university, role, verification_status, is_verified, points, avatar_url')
      .eq('id', decoded.userId)
      .single();

    if (shouldLogAuthDebug) {
      console.log('📊 用户查询结果详细:', {
        found: !!user,
        errorExists: !!error,
        userValue: user,
        errorValue: error,
        userId: decoded.userId
      });
    }

    if (error || !user) {
      console.error(`Authentication failed: User ${decoded.userId} not found in database`);
      console.error('查询错误详情 - error:', error);
      console.error('查询错误详情 - user:', user);
      console.error('查询错误详情 - error type:', typeof error);
      console.error('查询错误详情 - user type:', typeof user);
      throw new AppError('User not found. Please register first.', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // 验证用户是否已经通过验证
    if (user.verification_status !== 'verified' && !user.is_verified) {
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
      
      // 获取用户信息 - 只查询真实存在的用户
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, student_id, first_name, last_name, university, role, verification_status, is_verified, points, avatar_url')
        .eq('id', decoded.userId)
        .single();

      // 只有用户存在且已验证才设置到请求中
      if (!error && user && (user.verification_status === 'verified' || user.is_verified)) {
        req.user = user;
      } else if (!error && user) {
        // 用户存在但未验证，记录日志但不抛出错误（因为是可选认证）
        console.log(`User ${user.id} exists but is not verified in optional auth`);
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

// 防止游客用户创建内容的中间件 - 确保只有真正的注册用户才能执行写操作
export const requireRegisteredUser = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, ERROR_CODES.ACCESS_DENIED);
    }

    if (req.user.role === 'guest' || req.user.isGuest) {
      throw new AppError('Registered users only. Please create an account to perform this action.', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 额外检查：确保用户有真实的student_id（不是temp_开头的）
    if (req.user.student_id && req.user.student_id.startsWith('temp_')) {
      console.warn(`Detected user with temporary student_id: ${req.user.id}`);
      throw new AppError('Please complete your registration to perform this action.', 403, ERROR_CODES.ACCESS_DENIED);
    }

    next();
  } catch (error) {
    next(error);
  }
}; 
