import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';
import { sendOTPEmail } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Admin emails that get admin role
const ADMIN_EMAILS = ['admin@aura.com'];
const ADMIN_PHONES = ['7786852209'];
const PHONE_EMAIL_DOMAIN = 'phone.aura.local';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizePhone = (phone: string): string => phone.replace(/\D/g, '');

const isValidPhone = (phone: string): boolean => {
  const normalizedPhone = normalizePhone(phone);
  return normalizedPhone.length === 10;
};

const getPhoneRole = (phone: string): 'admin' | 'customer' => (
  ADMIN_PHONES.includes(phone) ? 'admin' : 'customer'
);

const buildPhoneEmail = (phone: string): string => `phone_${phone}@${PHONE_EMAIL_DOMAIN}`;

const isPhoneAliasEmail = (email: string): boolean => email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);

const serializeSavedCart = (savedCart: IUser['savedCart']) => (
  Array.isArray(savedCart)
    ? savedCart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        quantity: item.quantity,
        productName: item.productName,
        variantName: item.variantName,
        price: item.price,
        image: item.image,
      }))
    : []
);

const toPublicUser = (user: IUser) => {
  const addressStr = user.address
    ? [user.address.street, user.address.city, user.address.state, user.address.zip, user.address.country]
        .filter(Boolean).join(', ')
    : undefined;

  return {
    id: user._id.toString(),
    email: isPhoneAliasEmail(user.email) ? undefined : user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    address: addressStr,
    preferences: user.preferences?.notes || [],
    savedCart: serializeSavedCart(user.savedCart),
  };
};

// Generate JWT token
const generateToken = (userId: string, email: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { userId, email, role },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const normalizedPhone = typeof phone === 'string' ? normalizePhone(phone) : '';
    const isPhoneLogin = Boolean(normalizedPhone);

    if (!normalizedEmail && !normalizedPhone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    if (isPhoneLogin) {
      if (!isValidPhone(normalizedPhone)) {
        res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    let user = isPhoneLogin
      ? await User.findOne({
          $or: [
            { phone: normalizedPhone },
            { email: buildPhoneEmail(normalizedPhone) },
          ],
        })
      : await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      const role = isPhoneLogin
        ? getPhoneRole(normalizedPhone)
        : (ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' : 'customer');
      
      user = new User({
        email: isPhoneLogin ? buildPhoneEmail(normalizedPhone) : normalizedEmail,
        name: isPhoneLogin
          ? (role === 'admin' ? 'Aura Admin' : `Aura Client ${normalizedPhone.slice(-4)}`)
          : normalizedEmail.split('@')[0],
        role,
        phone: isPhoneLogin ? normalizedPhone : undefined,
        otp: { code: otp, expiresAt: otpExpiry },
      });
    } else {
      // Update existing user's OTP
      if (isPhoneLogin) {
        user.phone = normalizedPhone;
        user.role = getPhoneRole(normalizedPhone);
      }
      user.otp = { code: otp, expiresAt: otpExpiry };
    }

    await user.save();

    // In development, include the OTP in response for testing
    const response: { message: string; previewUrl?: string; demoCode?: string } = {
      message: isPhoneLogin ? 'OTP generated successfully' : 'OTP sent successfully',
    };

    if (!isPhoneLogin) {
      const emailResult = await sendOTPEmail(normalizedEmail, otp);

      if (!emailResult.success) {
        res.status(500).json({ error: 'Failed to send OTP email' });
        return;
      }

      if (emailResult.previewUrl) {
        response.previewUrl = emailResult.previewUrl;
      }
    }

    if (isPhoneLogin || process.env.NODE_ENV !== 'production') {
      response.demoCode = otp;
    }

    res.json(response);
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, code } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const normalizedPhone = typeof phone === 'string' ? normalizePhone(phone) : '';
    const isPhoneLogin = Boolean(normalizedPhone);

    if ((!normalizedEmail && !normalizedPhone) || !code) {
      res.status(400).json({ error: 'Phone number and OTP code are required' });
      return;
    }

    // Find user
    const user = isPhoneLogin
      ? await User.findOne({
          $or: [
            { phone: normalizedPhone },
            { email: buildPhoneEmail(normalizedPhone) },
          ],
        })
      : await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    // Check OTP
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      res.status(400).json({ error: 'No OTP found. Please request a new one.' });
      return;
    }

    // Check if OTP expired
    if (new Date() > user.otp.expiresAt) {
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Verify OTP
    if (user.otp.code !== code) {
      res.status(400).json({ error: 'Invalid OTP code' });
      return;
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(
      user._id.toString(),
      user.email,
      user.role
    );

    // Return user data and token
    res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
