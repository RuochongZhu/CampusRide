import { sendVerificationEmail, generateEmailVerificationToken } from '../src/services/email.service.js';

async function testEmailSending() {
  try {
    console.log('🧪 Testing email sending with Resend API...');
    console.log('📧 Target email: rz469@cornell.edu');
    
    const testToken = generateEmailVerificationToken();
    console.log('🔑 Generated token:', testToken);
    
    const result = await sendVerificationEmail('rz469@cornell.edu', testToken);
    
    console.log('✅ Email test completed successfully!');
    console.log('📬 Email ID:', result.emailId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error details:', error.message);
  }
}

testEmailSending();