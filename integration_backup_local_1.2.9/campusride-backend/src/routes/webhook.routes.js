import express from 'express';
import { Resend } from 'resend';

const router = express.Router();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email addresses configuration
const SUPPORT_EMAIL = 'support@campusgo.college';
const FORWARD_TO_EMAIL = 'rz469@cornell.edu';

/**
 * Webhook endpoint for Resend Inbound emails
 * POST /api/v1/webhook/email-inbound
 *
 * When someone sends an email to support@campusgo.app,
 * Resend will POST the email data to this endpoint,
 * and we forward it to rz469@cornell.edu
 */
router.post('/email-inbound', async (req, res) => {
  try {
    const { from, to, subject, text, html, attachments } = req.body;

    console.log('📧 Received inbound email:');
    console.log(`  From: ${from}`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);

    // Forward the email to the admin
    const { data, error } = await resend.emails.send({
      from: `CampusGo Support <${SUPPORT_EMAIL}>`,
      to: FORWARD_TO_EMAIL,
      subject: `[CampusGo Support] ${subject}`,
      html: `
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Original sender:</strong> ${from}</p>
          <p><strong>Original recipient:</strong> ${to}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <hr style="margin: 20px 0;">
        <div>
          ${html || `<pre>${text}</pre>`}
        </div>
      `,
      text: `
--- Forwarded Email ---
From: ${from}
To: ${to}
Subject: ${subject}
---

${text}
      `
    });

    if (error) {
      console.error('Failed to forward email:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log('✅ Email forwarded successfully:', data?.id);
    res.json({ success: true, message: 'Email forwarded', id: data?.id });

  } catch (error) {
    console.error('Email inbound webhook error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
