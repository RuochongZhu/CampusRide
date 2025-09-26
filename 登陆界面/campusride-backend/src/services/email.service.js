import crypto from 'crypto';
import dotenv from 'dotenv';

// 确保环境变量被正确加载
dotenv.config();

// 使用原生 fetch 调用 Resend API
const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// 调试信息
console.log('📧 Email Service Initialized:');
console.log('- API Key present:', RESEND_API_KEY ? '✅' : '❌');
console.log('- Frontend URL:', process.env.FRONTEND_URL);
console.log('- From Email:', process.env.RESEND_FROM_EMAIL);

/**
 * 生成邮箱验证token
 */
export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * 创建邮箱验证HTML模板
 */
const createVerificationEmailTemplate = (verificationUrl, userEmail) => {
  const netid = userEmail.split('@')[0];
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Campus Ride</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #B31B1B; color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: #B31B1B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .btn:hover { background: #8F1515; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 Campus Ride</h1>
        <p>Cornell University Platform</p>
      </div>
      <div class="content">
        <h2>Welcome, ${netid}!</h2>
        <p>Thank you for registering with Campus Ride. To complete your registration and start using our platform, please verify your email address.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" class="btn">Verify My Email</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #e9e9e9; padding: 10px; border-radius: 3px; word-break: break-all;">
          ${verificationUrl}
        </p>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with Campus Ride, please ignore this email.
        </div>
        
        <p>Best regards,<br>The Campus Ride Team</p>
      </div>
      <div class="footer">
        <p>Campus Ride - Cornell University<br>
        This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * 发送邮箱验证邮件 - 使用原生 fetch 调用 Resend API
 */
export const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    const netid = email.split('@')[0];
    
    console.log(`📧 Attempting to send verification email to ${email}`);
    console.log(`🔗 Verification URL: ${verificationUrl}`);
    
    // 使用简化的纯文本邮件，避免HTML被过滤
    const emailData = {
      from: `Campus Ride <${process.env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: 'Campus Ride Email Verification',
      text: `Hello ${netid},

Welcome to Campus Ride! Please verify your Cornell email address by clicking this link:

${verificationUrl}

This verification link expires in 24 hours.

If you did not create this account, please ignore this email.

Campus Ride Team
Cornell University
      `.trim()
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
    }

    console.log('✅ Verification email sent successfully:', { 
      to: email, 
      emailId: result.id,
      verificationUrl 
    });
    
    return { success: true, emailId: result.id };
  } catch (error) {
    console.error('❌ Error in sendVerificationEmail:', error);
    throw error;
  }
};

/**
 * 发送重新验证邮件
 */
export const resendVerificationEmail = async (email, token) => {
  return await sendVerificationEmail(email, token);
};

/**
 * 验证token是否有效（未过期）
 */
export const isTokenExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * 生成token过期时间（24小时后）
 */
export const generateTokenExpiry = () => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24小时后过期
  return expiry;
};

/**
 * 发送密码重置邮件
 */
export const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const netid = email.split('@')[0];
    
    console.log(`📧 Attempting to send password reset email to ${email}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);
    
    // 使用简化的纯文本邮件，避免HTML被过滤
    const emailData = {
      from: `Campus Ride <${process.env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: 'Campus Ride Password Reset',
      text: `Hello ${netid},

We received a request to reset your Campus Ride password. Click the link below to reset your password:

${resetUrl}

This password reset link expires in 24 hours. If you did not request a password reset, please ignore this email.

Campus Ride Team
Cornell University
      `.trim()
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      throw new Error(`Resend API error: ${result.message || response.statusText}`);
    }

    console.log('✅ Password reset email sent successfully:', { 
      to: email, 
      emailId: result.id,
      resetUrl 
    });
    
    return { success: true, emailId: result.id };
  } catch (error) {
    console.error('❌ Error in sendPasswordResetEmail:', error);
    throw error;
  }
};