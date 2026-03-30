import { Router, Request, Response } from 'express';
import Order from '../models/Order.js';
import User, { IUser } from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();
const PHONE_EMAIL_DOMAIN = 'phone.aura.local';
type CustomerStatus = 'Lead' | 'Active' | 'VIP' | 'At Risk';
type CustomerSentiment = 'Positive' | 'Neutral' | 'Negative';

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

const getDisplayEmail = (email: string): string => (
  isPhoneAliasEmail(email) ? '' : email
);

const deriveCustomerStatus = (params: {
  orderCount: number;
  totalSpend: number;
  lastInteraction: Date;
  hasSavedCart: boolean;
}): CustomerStatus => {
  const { orderCount, totalSpend, lastInteraction, hasSavedCart } = params;
  const inactiveDays = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

  if (totalSpend >= 3000 || orderCount >= 5) {
    return 'VIP';
  }

  if (orderCount > 0 && inactiveDays > 90 && !hasSavedCart) {
    return 'At Risk';
  }

  if (orderCount > 0 || hasSavedCart) {
    return 'Active';
  }

  return 'Lead';
};

const deriveCustomerSentiment = (status: CustomerStatus, orderCount: number): CustomerSentiment => {
  if (status === 'At Risk') {
    return 'Negative';
  }

  if (status === 'VIP' || orderCount > 0) {
    return 'Positive';
  }

  return 'Neutral';
};

const serializeCustomerOrders = (orders: InstanceType<typeof Order>[]) => (
  orders.map((order) => ({
    id: order._id.toString(),
    customerDetails: order.customerDetails,
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      variantId: item.variantId.toString(),
      productName: item.productName,
      variantName: item.variantName,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    total: order.total,
    status: order.status,
    date: order.createdAt,
  }))
);

const buildCustomerSummary = (user: IUser, orders: InstanceType<typeof Order>[]) => {
  const normalizedOrders = serializeCustomerOrders(
    [...orders].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  );
  const totalSpend = normalizedOrders.reduce((sum, order) => sum + order.total, 0);
  const hasSavedCart = normalizeSavedCart(user.savedCart).length > 0;
  const lastInteraction = normalizedOrders[0]?.date ?? user.updatedAt ?? user.createdAt;
  const status = deriveCustomerStatus({
    orderCount: normalizedOrders.length,
    totalSpend,
    lastInteraction,
    hasSavedCart,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: getDisplayEmail(user.email),
    phone: user.phone || '',
    avatar: user.avatar,
    status,
    sentiment: deriveCustomerSentiment(status, normalizedOrders.length),
    preferredNotes: user.preferences?.notes || [],
    lastInteraction,
    messages: [],
    orders: normalizedOrders,
    summary: normalizedOrders.length > 0
      ? `${user.name} has placed ${normalizedOrders.length} order${normalizedOrders.length === 1 ? '' : 's'} worth ₹${totalSpend.toFixed(2)} so far.`
      : hasSavedCart
        ? `${user.name} has items saved in cart but has not completed an order yet.`
        : `${user.name} has created an account but has not interacted beyond signup yet.`,
    nextAction: status === 'At Risk'
      ? 'Reach out with a win-back offer or a personalized recommendation.'
      : status === 'Lead'
        ? 'Encourage a first order with a starter offer.'
        : hasSavedCart
          ? 'Follow up on the saved cart before it goes stale.'
          : 'Maintain engagement with new launches and restock alerts.',
  };
};

const escapeCsvValue = (value: string | number | null | undefined): string => {
  const rawValue = value === null || value === undefined ? '' : String(value);
  const escaped = rawValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

const buildUsersCsv = (rows: Array<{
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  sentiment: CustomerSentiment;
  totalOrders: number;
  totalSpend: number;
  savedCartItems: number;
  lastInteraction: Date;
  createdAt: Date;
  updatedAt: Date;
  address: string;
  preferences: string[];
}>) => {
  const header = [
    'id',
    'role',
    'name',
    'email',
    'phone',
    'status',
    'sentiment',
    'totalOrders',
    'totalSpend',
    'savedCartItems',
    'lastInteraction',
    'createdAt',
    'updatedAt',
    'address',
    'preferences',
  ];

  const lines = rows.map((row) => ([
    row.id,
    row.role,
    row.name,
    row.email,
    row.phone,
    row.status,
    row.sentiment,
    row.totalOrders,
    row.totalSpend.toFixed(2),
    row.savedCartItems,
    row.lastInteraction.toISOString(),
    row.createdAt.toISOString(),
    row.updatedAt.toISOString(),
    row.address,
    row.preferences.join(' | '),
  ].map(escapeCsvValue).join(',')));

  return [header.join(','), ...lines].join('\n');
};

const loadAdminCustomers = async () => {
  const users = await User.find({ role: 'customer' }).sort({ updatedAt: -1 });
  const orders = await Order.find({ userId: { $in: users.map((user) => user._id) } })
    .sort({ createdAt: -1 });
  const ordersByUserId = new Map<string, InstanceType<typeof Order>[]>();

  for (const order of orders) {
    const key = order.userId.toString();
    const entries = ordersByUserId.get(key) || [];
    entries.push(order);
    ordersByUserId.set(key, entries);
  }

  return users
    .map((user) => buildCustomerSummary(user, ordersByUserId.get(user._id.toString()) || []))
    .sort((left, right) => right.lastInteraction.getTime() - left.lastInteraction.getTime());
};

// GET /api/users/admin/customers - Get CRM customer list (Admin only)
router.get('/admin/customers', authenticateToken, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const customers = await loadAdminCustomers();
    res.json({ customers });
  } catch (error) {
    console.error('Get admin customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/users/admin/export - Export all users as CSV (Admin only)
router.get('/admin/export', authenticateToken, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const orders = await Order.find({ userId: { $in: users.map((user) => user._id) } });
    const ordersByUserId = new Map<string, InstanceType<typeof Order>[]>();

    for (const order of orders) {
      const key = order.userId.toString();
      const entries = ordersByUserId.get(key) || [];
      entries.push(order);
      ordersByUserId.set(key, entries);
    }

    const csv = buildUsersCsv(users.map((user) => {
      const userOrders = ordersByUserId.get(user._id.toString()) || [];
      const lastInteraction = userOrders
        .map((order) => order.createdAt)
        .sort((left, right) => right.getTime() - left.getTime())[0]
        ?? user.updatedAt
        ?? user.createdAt;
      const totalSpend = userOrders.reduce((sum, order) => sum + order.total, 0);
      const savedCartItems = normalizeSavedCart(user.savedCart).length;
      const status = deriveCustomerStatus({
        orderCount: userOrders.length,
        totalSpend,
        lastInteraction,
        hasSavedCart: savedCartItems > 0,
      });

      return {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: getDisplayEmail(user.email),
        phone: user.phone || '',
        status,
        sentiment: deriveCustomerSentiment(status, userOrders.length),
        totalOrders: userOrders.length,
        totalSpend,
        savedCartItems,
        lastInteraction,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        address: formatAddress(user.address) || '',
        preferences: user.preferences?.notes || [],
      };
    }));

    const filename = `aura-users-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export users CSV error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
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
