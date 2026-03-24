import nodemailer from 'nodemailer';

// Create transporter based on environment
const createTransporter = () => {
  // For production, use configured SMTP
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // For development, use Ethereal (fake SMTP)
  console.log('No email configuration found. Using Ethereal for testing.');
  return null;
};

let transporter: nodemailer.Transporter | null = null;

export const initEmailService = async () => {
  transporter = createTransporter();
  
  if (!transporter) {
    // Create test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Using Ethereal test email account');
  }
};

export const sendOTPEmail = async (email: string, otp: string): Promise<{ success: boolean; previewUrl?: string }> => {
  if (!transporter) {
    await initEmailService();
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Aura Parfumerie" <noreply@aura-parfumerie.com>',
    to: email,
    subject: 'Your Aura Parfumerie Login Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Georgia', serif; background-color: #f9f7f4; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 28px; letter-spacing: 2px;">AURA</h1>
              <p style="color: #a8a8a8; margin: 8px 0 0 0; font-size: 12px; letter-spacing: 3px;">PARFUMERIE</p>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Your verification code is:
              </p>
              <div style="background: #f5f3f0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                This code will expire in 10 minutes.<br>
                If you didn't request this code, please ignore this email.
              </p>
            </div>
            <div style="background: #f9f7f4; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2026 Aura Parfumerie. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your Aura Parfumerie verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
  };

  try {
    const info = await transporter!.sendMail(mailOptions);
    
    // Get preview URL for Ethereal emails (development only)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    if (previewUrl) {
      console.log('Preview URL:', previewUrl);
    }

    return { success: true, previewUrl: previewUrl || undefined };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false };
  }
};

export default { sendOTPEmail, initEmailService };
