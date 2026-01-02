import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Environment Variables Check:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Present' : '❌ Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Not set');
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Not set');
console.log('RESEND_FROM_NAME:', process.env.RESEND_FROM_NAME || '❌ Not set');

console.log('\n🧪 Testing Resend API directly...');

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function testResendAPI() {
  try {
    const emailData = {
      from: 'Campus Ride <noreply@socialinteraction.club>',
      to: ['rz469@cornell.edu'],
      subject: 'Test Email from Campus Ride',
      html: '<h1>Test Email</h1><p>This is a test email to verify Resend API integration.</p>',
      text: 'Test Email - This is a test email to verify Resend API integration.'
    };

    console.log('📧 Sending test email...');
    console.log('API Key (first 10 chars):', RESEND_API_KEY?.substring(0, 10) + '...');

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Email ID:', result.id);
    } else {
      console.log('❌ Email sending failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testResendAPI();