import bcrypt from 'bcryptjs';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';
import { 
  sendVerificationEmail, 
  generateEmailVerificationToken, 
  generateTokenExpiry,
  isTokenExpired,
  resendVerificationEmail,
  sendPasswordResetEmail
} from '../services/email.service.js';

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId, userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 生成刷新token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// 用户注册
export const register = async (req, res, next) => {
  try {
    const { nickname, email, password } = req.body;

    // 基础验证
    if (!nickname || !email || !password) {
      throw new AppError('Nickname, email and password are required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 昵称验证
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2) {
      throw new AppError('Display name must be at least 2 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (trimmedNickname.length > 50) {
      throw new AppError('Display name must be less than 50 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Cornell邮箱验证
    // Gmail support temporarily disabled - uncomment line below to re-enable Gmail testing
    // if (!email.endsWith('@cornell.edu') && !email.endsWith('@gmail.com')) {
    if (!email.endsWith('@cornell.edu')) {
      throw new AppError('Email must end with @cornell.edu', 400, ERROR_CODES.INVALID_FORMAT);
    }

    // 密码验证: 至少8位，包含大小写字母和数字
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new AppError('Password must contain at least one uppercase letter', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new AppError('Password must contain at least one lowercase letter', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      throw new AppError('Password must contain at least one number', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new AppError('Account already exists with this email address', 400, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 从邮箱提取用户标识作为student_id
    const netid = email.split('@')[0];

    // 生成邮箱验证token和过期时间
    const emailVerificationToken = generateEmailVerificationToken();
    const emailVerificationExpires = generateTokenExpiry();

    // 创建用户 - 未验证状态
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        student_id: netid,
        email,
        password_hash: hashedPassword,
        first_name: trimmedNickname, // Store nickname in first_name for now
        last_name: netid,
        university: 'Cornell University',
        email_verification_token: emailVerificationToken,
        email_verification_expires: emailVerificationExpires.toISOString(),
        is_verified: false
      })
      .select('id, email, first_name, last_name, university, student_id, created_at')
      .single();

    if (error) {
      throw new AppError('Failed to create user', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 发送验证邮件
    try {
      await sendVerificationEmail(email, emailVerificationToken);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // 不阻止注册，但记录错误
    }

    // 添加注册积分奖励
    try {
      console.log(`🎯 Adding registration points for user: ${email}`);
      
      // 添加注册积分交易记录
      const { error: pointsError } = await supabaseAdmin
        .from('point_transactions')
        .insert({
          user_id: newUser.id,
          rule_type: 'registration',
          points: 10,
          source: 'system',
          reason: '用户注册奖励',
          multiplier: 1
        });

      if (pointsError) {
        console.error('❌ Failed to add registration points:', pointsError);
      } else {
        // 更新用户总积分
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ points: 10 })
          .eq('id', newUser.id);

        if (updateError) {
          console.error('❌ Failed to update user points:', updateError);
        } else {
          console.log(`✅ Added 10 registration points for ${email}`);
        }
      }
    } catch (pointsError) {
      console.error('❌ Error in points system:', pointsError);
      // 不阻止注册流程
    }

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        message: 'Registration successful! Please check your email to verify your account.'
      },
      message: 'User registered successfully. Please verify your email address.'
    });
  } catch (error) {
    next(error);
  }
};

// 用户登录
export const login = async (req, res, next) => {
  try {
    const { email, password, openid } = req.body;

    if (!email || !password) {
      throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    try {
      // 查找用户
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      // 如果用户不存在，返回统一的错误信息
      if (error && error.code === 'PGRST116') {
        throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS);
      }

      if (!user) {
        throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS);
      }

      // 验证密码（必须首先验证密码）
      const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS);
      }

      // 检查账户是否激活
      const isActive = user.is_active !== undefined ? user.is_active : true;
      if (!isActive) {
        throw new AppError('Account is disabled', 401, ERROR_CODES.ACCESS_DENIED);
      }

      // 检查邮箱是否已验证（只有密码正确后才检查）
      if (!user.is_verified) {
        throw new AppError(
          'Email not verified. Please check your inbox for verification link.',
          401,
          'EMAIL_NOT_VERIFIED'
        );
      }

      // 生成token和refresh token
      const token = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // 更新最后登录时间和处理openid
      try {
        // 如果提供了openid，处理wechat_openid字段
        if (openid) {
          // 首先，将其他用户的相同openid设置为空字符串
          await supabaseAdmin
            .from('users')
            .update({ wechat_openid: '' })
            .eq('wechat_openid', openid)
            .neq('id', user.id);

          // 然后，更新当前用户的wechat_openid
          await supabaseAdmin
            .from('users')
            .update({ 
              last_login_at: new Date().toISOString(),
              wechat_openid: openid
            })
            .eq('id', user.id);
        } else {
          // 没有提供openid，只更新最后登录时间
          await supabaseAdmin
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      } catch (updateError) {
        console.error('Failed to update user information:', updateError);
      }

      // 重新获取用户信息，包含更新后的wechat_openid
      const { data: updatedUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // 移除敏感数据
      const { password_hash, email_verification_token, ...userWithoutSensitiveData } = updatedUser || user;

      res.json({
        success: true,
        data: {
          user: userWithoutSensitiveData,
          token,
          refresh_token: refreshToken,
          tokenType: 'Bearer'
        },
        message: 'Login successful'
      });
    } catch (dbError) {
      // 如果是已知的AppError，直接抛出
      if (dbError.isOperational) {
        throw dbError;
      }
      // 所有其他数据库错误都返回统一的错误信息
      console.error('Database error during login:', dbError);
      throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }
  } catch (error) {
    next(error);
  }
};

// 用户登出
export const logout = async (_req, res, next) => {
  try {
    // 在实际应用中，这里可以将token加入黑名单
    // 目前只是返回成功响应
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// 邮箱验证
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError('Verification token is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, email_verification_token, email_verification_expires, is_verified')
      .eq('email_verification_token', token)
      .single();

    if (error || !user) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    // 检查用户是否已经验证过
    if (user.is_verified) {
      return res.json({
        success: true,
        message: 'Email address is already verified'
      });
    }

    // 检查token是否过期
    if (isTokenExpired(user.email_verification_expires)) {
      throw new AppError(
        'Verification token has expired. Please request a new verification email.',
        400,
        'TOKEN_EXPIRED'
      );
    }

    // 更新用户验证状态
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_verified: true,
        verification_status: 'verified',
        email_verification_token: null,
        email_verification_expires: null
      })
      .eq('id', user.id);

    if (updateError) {
      throw new AppError('Failed to verify email', 500, ERROR_CODES.DATABASE_ERROR);
    }

    // 添加邮箱验证积分奖励
    try {
      console.log(`🎯 Adding verification points for user: ${user.email}`);
      
      const { error: pointsError } = await supabaseAdmin
        .from('point_transactions')
        .insert({
          user_id: user.id,
          rule_type: 'verification',
          points: 5,
          source: 'system',
          reason: '邮箱验证奖励',
          multiplier: 1
        });

      if (pointsError) {
        console.error('❌ Failed to add verification points:', pointsError);
      } else {
        // 更新用户总积分 (当前积分 + 5)
        const { data: currentUser, error: getUserError } = await supabaseAdmin
          .from('users')
          .select('points')
          .eq('id', user.id)
          .single();

        if (!getUserError && currentUser) {
          const newPoints = (currentUser.points || 0) + 5;
          await supabaseAdmin
            .from('users')
            .update({ points: newPoints })
            .eq('id', user.id);
          
          console.log(`✅ Added 5 verification points for ${user.email}`);
        }
      }
    } catch (pointsError) {
      console.error('❌ Error in verification points system:', pointsError);
    }

    // 返回成功响应，让前端处理跳转
    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// 重新发送验证邮件
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email)
      .single();

    if (error || !user) {
      // 安全考虑：不透露用户是否存在
      return res.json({
        success: true,
        message: 'If the email address is registered, a verification email will be sent.'
      });
    }

    // 检查用户是否已经验证过
    if (user.is_verified) {
      return res.json({
        success: true,
        message: 'Email address is already verified'
      });
    }

    // 生成新的验证token
    const newToken = generateEmailVerificationToken();
    const newExpiry = generateTokenExpiry();

    // 更新用户的验证token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verification_token: newToken,
        email_verification_expires: newExpiry.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw new AppError('Failed to update verification token', 500, ERROR_CODES.DATABASE_ERROR);
    }

    // 发送新的验证邮件
    try {
      await resendVerificationEmail(email, newToken);
      console.log(`✅ New verification email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      throw new AppError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED');
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

// 刷新token
export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AppError('Refresh token is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    
    // 验证token类型是否为refresh
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401, ERROR_CODES.TOKEN_INVALID);
    }

    // 验证用户仍然存在且激活
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', decoded.id)
      .single();
    if (error || !user ) {
      throw new AppError('Invalid token ???', 401, ERROR_CODES.TOKEN_INVALID);
    }

    // 生成新的access token和refresh token
    const newAccessToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        refresh_token: newRefreshToken,
        tokenType: 'Bearer'
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 忘记密码
export const forgotPassword = async (req, res, next) => {
  try {
    console.log('🚀 Forgot password request:', req.body);
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // Cornell邮箱验证
    if (!email.endsWith('@cornell.edu')) {
      throw new AppError('Email must end with @cornell.edu', 400, ERROR_CODES.INVALID_FORMAT);
    }

    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email)
      .single();

    console.log('🔍 User lookup:', { email, found: !!user, error: error?.message });

    if (error || !user) {
      // 安全考虑：不透露用户是否存在
      return res.json({
        success: true,
        message: 'If the email address is registered, a password reset email will be sent.'
      });
    }

    console.log('👤 Found user:', { id: user.id, verified: user.is_verified });

    // 检查用户是否已验证邮箱
    if (!user.is_verified) {
      throw new AppError('Email not verified. Please verify your email first.', 400, 'EMAIL_NOT_VERIFIED');
    }

    // 生成密码重置token
    const resetToken = generateEmailVerificationToken();
    const resetExpiry = generateTokenExpiry();

    // 更新用户的重置token（重用email verification字段）
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verification_token: resetToken,
        email_verification_expires: resetExpiry.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw new AppError('Failed to generate password reset token', 500, ERROR_CODES.DATABASE_ERROR, updateError);
    }

    // 发送密码重置邮件
    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      throw new AppError('Failed to send password reset email', 500, 'EMAIL_SEND_FAILED');
    }

    res.json({
      success: true,
      message: 'Password reset email sent successfully. Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

// 重置密码
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      throw new AppError('Reset token is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    if (!password) {
      throw new AppError('Password is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 密码验证: 至少8位，包含大小写字母和数字
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new AppError('Password must contain at least one uppercase letter', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new AppError('Password must contain at least one lowercase letter', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      throw new AppError('Password must contain at least one number', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 查找用户（通过email verification token字段）
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, email_verification_token, email_verification_expires, is_verified')
      .eq('email_verification_token', token)
      .single();

    if (error || !user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    // 检查用户必须是已验证的（密码重置只对已验证用户有效）
    if (!user.is_verified) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    // 检查token是否过期
    if (isTokenExpired(user.email_verification_expires)) {
      throw new AppError(
        'Reset token has expired. Please request a new password reset.',
        400,
        'TOKEN_EXPIRED'
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 更新用户密码并清空验证token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedPassword,
        email_verification_token: null,
        email_verification_expires: null
      })
      .eq('id', user.id);

    if (updateError) {
      throw new AppError('Failed to reset password', 500, ERROR_CODES.DATABASE_ERROR);
    }

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// 游客登录
export const guestLogin = async (req, res, next) => {
  try {
    // 生成游客token
    const guestToken = jwt.sign(
      { id: 'guest', userId: 'guest', type: 'guest' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: 'guest',
          email: 'guest@example.com',
          first_name: 'Guest',
          last_name: 'User',
          student_id: 'guest',
          university: 'Cornell University',
          role: 'guest',
          points: 0,
          isGuest: true
        },
        token: guestToken,
        tokenType: 'Bearer'
      },
      message: 'Guest login successful'
    });
  } catch (error) {
    next(error);
  }
};

// 微信登录
export const wechatLogin = async (req, res, next) => {
  try {
    if (process.env.DISABLE_WECHAT_AUTH === 'true') {
      throw new AppError('WeChat login is disabled in local mode', 503, 'WECHAT_LOGIN_DISABLED');
    }

    const { code } = req.body;

    if (!code) {
      throw new AppError('WeChat code is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 获取微信小程序配置
    const appId = process.env.WECHAT_APPID;
    const appSecret = process.env.WECHAT_APPSECRET;

    if (!appId || !appSecret) {
      throw new AppError('WeChat Mini Program configuration not found', 500, 'WECHAT_CONFIG_MISSING');
    }
    // 调用微信API获取openid
    const response = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    );

    const { openid, session_key } = response.data;
    if (!openid) {
      throw new AppError('Failed to get WeChat openid', 400, 'WECHAT_OPENID_ERROR');
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wechat_openid', openid)
      .single();
    if (existingUser) {
      // 用户已存在，更新登录时间
      await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingUser.id);
        // 生成token和refresh token
        const token = generateToken(existingUser.id);
        const refreshToken = generateRefreshToken(existingUser.id);
        const { password_hash, email_verification_token, ...userWithoutSensitiveData } = existingUser;
        res.json({
          success: true,
          data: {
            openid:openid,
            user: userWithoutSensitiveData,
            token,
            refresh_token: refreshToken,
            tokenType: 'Bearer'
          },
          message: 'WeChat login successful'
        });
    }else{
      res.json({
        success:true,
        message:'WeChat login successful, please register to continue',
        data:{
          openid:openid
        }
      })
    }
  } catch (error) {
    console.error('WeChat login error:', error);
    next(error);
  }
};
