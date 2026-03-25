import { Router, Request, Response } from 'express';
import User, { IUser } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const PHONE_EMAIL_DOMAIN = 'phone.aura.local';

// Helper to format address as string
const formatAddress = (address: { street?: string; city?: string; state?: string; zip?: string; country?: string } | undefined): string | undefined => {
  if (!address) return undefined;
  return [address.street, address.city, address.state, address.zip, address.country]
    .filter(Boolean).join(', ') || undefined;
};

const isPhoneAliasEmail = (email: string): boolean => email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);

const normalizeSavedCart = (savedCart: unknown) => {
  if (!Array.isArray(savedCart)) {
    return [];
  }

  return savedCart
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const entry = item as Record<string, unknown>;
      const quantityValue = Number(entry.quantity);
      const priceValue = Number(entry.price);

      if (
        typeof entry.productId !== 'string' ||
        typeof entry.variantId !== 'string' ||
        typeof entry.productName !== 'string' ||
        typeof entry.variantName !== 'string' ||
        typeof entry.image !== 'string' ||
        !Number.isFinite(quantityValue) ||
        quantityValue < 1 ||
        !Number.isFinite(priceValue) ||
        priceValue < 0
      ) {
        return null;
      }

      return {
        productId: entry.productId.trim(),
        variantId: entry.variantId.trim(),
        sku: typeof entry.sku === 'string' ? entry.sku.trim() : undefined,
        quantity: Math.floor(quantityValue),
        productName: entry.productName.trim(),
        variantName: entry.variantName.trim(),
        price: priceValue,
        image: entry.image.trim(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
};

const toPublicUser = (user: IUser) => ({
  id: user._id.toString(),
  email: isPhoneAliasEmail(user.email) ? undefined : user.email,
  name: user.name,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
  address: formatAddress(user.address),
  preferences: user.preferences?.notes || [],
  savedCart: normalizeSavedCart(user.savedCart),
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, email, phone, avatar, address, preferences, savedCart } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      const duplicateEmailOwner = await User.findOne({
        _id: { $ne: userId },
        email: normalizedEmail,
      }).select('_id');

      if (duplicateEmailOwner) {
        res.status(400).json({ error: 'That email is already in use by another account' });
        return;
      }

      user.email = normalizedEmail;
    }
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    
    // Handle address - accept either string or object
    if (address !== undefined) {
      if (typeof address === 'string') {
        // Parse string address (simple split by comma)
        const parts = address.split(',').map(s => s.trim());
        user.address = {
          street: parts[0] || '',
          city: parts[1] || '',
          state: parts[2] || '',
          zip: parts[3] || '',
          country: parts[4] || '',
        };
      } else {
        user.address = {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zip: address.zip || '',
          country: address.country || '',
        };
      }
    }
    
    // Handle preferences - accept either array or object
    if (preferences !== undefined) {
      if (Array.isArray(preferences)) {
        user.preferences = {
          notes: preferences,
          categories: [],
        };
      } else {
        user.preferences = {
          notes: preferences.notes || [],
          categories: preferences.categories || [],
        };
      }
    }

    if (savedCart !== undefined) {
      user.savedCart = normalizeSavedCart(savedCart);
    }

    await user.save();

    res.json({
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      res.status(400).json({ error: 'That email is already in use by another account' });
      return;
    }

    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update profile' });
  }
});

// GET /api/users/profile - Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
