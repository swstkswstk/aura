import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { ensureProductVariantIds, getStableVariantId, getStableVariantObjectId } from '../utils/productUtils.js';

const router = Router();

const reserveVariantStock = async (
  product: InstanceType<typeof Product>,
  variant: NonNullable<InstanceType<typeof Product>['variants'][number]>,
  variantIndex: number,
  quantity: number,
): Promise<boolean> => {
  const reservationAttempts: Array<Promise<{ modifiedCount?: number }>> = [];
  const stableVariantObjectId = getStableVariantObjectId(product, variant, variantIndex);

  if (variant._id || stableVariantObjectId) {
    reservationAttempts.push(
      Product.updateOne(
        {
          _id: product._id,
          'variants._id': stableVariantObjectId,
          'variants.stock': { $gte: quantity },
        },
        {
          $inc: {
            'variants.$.stock': -quantity,
          },
        },
      ),
    );
  }

  if (variant.sku) {
    reservationAttempts.push(
      Product.updateOne(
        {
          _id: product._id,
          'variants.sku': variant.sku,
          'variants.stock': { $gte: quantity },
        },
        {
          $inc: {
            'variants.$.stock': -quantity,
          },
        },
      ),
    );
  }

  const sameNameVariants = product.variants.filter((currentVariant) => currentVariant.name === variant.name);
  if (variant.name && sameNameVariants.length === 1) {
    reservationAttempts.push(
      Product.updateOne(
        {
          _id: product._id,
          'variants.name': variant.name,
          'variants.stock': { $gte: quantity },
        },
        {
          $inc: {
            'variants.$.stock': -quantity,
          },
        },
      ),
    );
  }

  if (product.variants.length === 1) {
    reservationAttempts.push(
      Product.updateOne(
        {
          _id: product._id,
          'variants.0.stock': { $gte: quantity },
        },
        {
          $inc: {
            'variants.0.stock': -quantity,
          },
        },
      ),
    );
  }

  for (const attempt of reservationAttempts) {
    const result = await attempt;
    if (result.modifiedCount === 1) {
      return true;
    }
  }

  return false;
};

const resolveVariantIndex = (
  product: InstanceType<typeof Product>,
  item: { variantId?: string; sku?: string; variantName?: string },
): number => {
  if (typeof item.variantId === 'string' && item.variantId) {
    const stableIdMatchIndex = product.variants.findIndex((variant, index) => (
      getStableVariantId(product, variant, index) === item.variantId ||
      variant._id?.toString() === item.variantId
    ));

    if (stableIdMatchIndex >= 0) {
      return stableIdMatchIndex;
    }
  }

  if (typeof item.sku === 'string' && item.sku) {
    const skuMatchIndex = product.variants.findIndex((variant) => variant.sku === item.sku);
    if (skuMatchIndex >= 0) {
      return skuMatchIndex;
    }
  }

  if (typeof item.variantName === 'string' && item.variantName) {
    const matchingVariants = product.variants
      .map((variant, index) => ({ variant, index }))
      .filter(({ variant }) => variant.name === item.variantName);

    if (matchingVariants.length === 1) {
      return matchingVariants[0].index;
    }
  }

  return product.variants.length === 1 ? 0 : -1;
};

// GET /api/orders/admin/all - Get all orders (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Get user details for each order
    const userIds = [...new Set(orders.map(o => o.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Transform to frontend format with user details
    const formattedOrders = orders.map((order) => {
      const user = userMap.get(order.userId.toString());
      return {
        id: order._id.toString(),
        userId: order.userId.toString(),
        userEmail: user?.email || order.customerDetails.email,
        userName: user?.name || order.customerDetails.name,
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
      };
    });

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.status = status;
    await order.save();

    res.json({
      order: {
        id: order._id.toString(),
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/orders - Get user's orders
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Transform to frontend format
    const formattedOrders = orders.map((order) => ({
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
    }));

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders - Create new order
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { items, customerDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must have at least one item' });
      return;
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.address) {
      res.status(400).json({ error: 'Customer details (name, email, phone, address) are required' });
      return;
    }

    // Validate items and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      // Find product and variant
      const product = await Product.findById(item.productId);
      
      if (!product) {
        res.status(400).json({ error: `Product ${item.productId} not found` });
        return;
      }

      await ensureProductVariantIds(product);

      const variantIndex = resolveVariantIndex(product, item);
      const variant = variantIndex >= 0 ? product.variants[variantIndex] : undefined;

      if (!variant) {
        res.status(400).json({ error: `Variant ${item.variantId} not found` });
        return;
      }

      // Check stock
      if (variant.stock < item.quantity) {
        res.status(400).json({ 
          error: `Insufficient stock for ${product.name} - ${variant.name}` 
        });
        return;
      }

      const itemTotal = variant.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: new mongoose.Types.ObjectId(item.productId),
        variantId: getStableVariantObjectId(product, variant, variantIndex),
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        quantity: item.quantity,
        image: product.image,
      });

      // Update stock atomically so checkout doesn't depend on full product re-validation.
      const stockReserved = await reserveVariantStock(product, variant, variantIndex, item.quantity);

      if (!stockReserved) {
        res.status(400).json({
          error: `Unable to reserve stock for ${product.name} - ${variant.name}. Please try again.`,
        });
        return;
      }
    }

    // Create order
    const order = new Order({
      userId: new mongoose.Types.ObjectId(userId),
      customerDetails,
      items: orderItems,
      total,
      status: 'Pending',
    });

    await order.save();

    res.status(201).json({
      order: {
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
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create order' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      order: {
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
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
