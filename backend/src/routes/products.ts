import { Router, Request, Response } from 'express';
import Product from '../models/Product.js';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import { ImportLog } from '../models/ImportLog.js';
import {
  buildProductWritePayload,
  ensureProductVariantIds,
  normalizeProductCategory,
  serializeProduct,
  validateProductWritePayload,
} from '../utils/productUtils.js';

// Set up multer for in-memory uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// POST /api/products - Create product (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = buildProductWritePayload(req.body);
    const validationErrors = validateProductWritePayload(payload);

    if (validationErrors.length > 0) {
      res.status(400).json({ error: validationErrors.join(', ') });
      return;
    }

    const product = await Product.create(payload);
    await ensureProductVariantIds(product);

    res.status(201).json({ product: serializeProduct(product) });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// GET /api/products - Get all products
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    // Build query
    const query: Record<string, unknown> = { isActive: true };

    if (category && category !== 'All') {
      query.category = category === 'Fine Fragrance'
        ? { $in: ['Fine Fragrance', 'Fragrances'] }
        : category;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    await Promise.all(products.map((product) => ensureProductVariantIds(product)));

    const formattedProducts = products.map(serializeProduct);

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await ensureProductVariantIds(product);

    res.json({
      product: serializeProduct(product),
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await ensureProductVariantIds(product);

    const payload = buildProductWritePayload(req.body, product);
    const validationErrors = validateProductWritePayload(payload);

    if (validationErrors.length > 0) {
      res.status(400).json({ error: validationErrors.join(', ') });
      return;
    }

    product.set(payload);
    await product.save();
    await ensureProductVariantIds(product);

    res.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/bulk - Bulk import products (JSON)
router.post('/bulk', [authenticateToken, requireAdmin, upload.single('file')], async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const parsed = JSON.parse(req.file.buffer.toString('utf-8'));
    const productsArray = Array.isArray(parsed) ? parsed : parsed.products;

    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      res.status(400).json({ error: 'Invalid format. Expected an array of products or { products: [...] }' });
      return;
    }

    const report = { created: 0, updated: 0, errors: [] as string[] };

    for (const entry of productsArray) {
      try {
        const { id, name, category, image, variants } = entry;
        const hasCategory = category !== undefined && category !== null && category !== '';
        const normalizedCategory = normalizeProductCategory(category);

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
          report.errors.push(`Product ${name || id || 'unknown'} has no variants`);
          continue;
        }

        if (id) {
          // Update by product id
          const product = await Product.findById(id);
          if (!product) {
            // Create new product
            const newProduct = new Product({
              name: name || 'Unnamed Product',
              description: entry.description || '',
              category: normalizedCategory,
              notes: entry.notes || [],
              image: image || '',
              variants: variants.map((v: any) => ({
                name: v.name || '',
                type: v.type || 'EDP',
                price: v.price ?? 0,
                stock: v.stock ?? 0,
                sku: v.sku || ''
              }))
            });
            await newProduct.save();
            report.created++;
          } else {
            product.name = name ?? product.name;
            if (hasCategory) {
              product.category = normalizedCategory;
            }
            if (image) product.image = image;

            for (const v of variants) {
              if (!v.sku) {
                report.errors.push(`Variant in product ${product.name} missing sku`);
                continue;
              }
              const existingVariant = product.variants.find((pv) => pv.sku === v.sku);
              if (existingVariant) {
                if (v.name) existingVariant.name = v.name;
                if (v.price !== undefined) existingVariant.price = v.price;
                if (v.stock !== undefined) existingVariant.stock = v.stock;
              } else {
                product.variants.push({
                  name: v.name || '',
                  type: v.type || 'EDP',
                  price: v.price ?? 0,
                  stock: v.stock ?? 0,
                  sku: v.sku || ''
                });
              }
            }

            await product.save();
            report.updated++;
          }
        } else {
          // No product id provided — try to match by variant SKU
          let matched = false;
          for (const v of variants) {
            if (v.sku) {
              const product = await Product.findOne({ 'variants.sku': v.sku });
              if (product) {
                product.name = name ?? product.name;
                if (hasCategory) {
                  product.category = normalizedCategory;
                }
                if (image) product.image = image;

                const existingVariant = product.variants.find((pv) => pv.sku === v.sku)!;
                if (v.name) existingVariant.name = v.name;
                if (v.price !== undefined) existingVariant.price = v.price;
                if (v.stock !== undefined) existingVariant.stock = v.stock;

                await product.save();
                report.updated++;
                matched = true;
                break;
              }
            }
          }

          if (!matched) {
            const newProduct = new Product({
              name: name || 'Unnamed Product',
              description: entry.description || '',
              category: normalizedCategory,
              notes: entry.notes || [],
              image: image || '',
              variants: variants.map((v: any) => ({
                name: v.name || '',
                type: v.type || 'EDP',
                price: v.price ?? 0,
                stock: v.stock ?? 0,
                sku: v.sku || ''
              }))
            });
            await newProduct.save();
            report.created++;
          }
        }
      } catch (err) {
        console.error('Error importing product entry:', err);
        report.errors.push(String(err));
      }
    }

    // Save an import log for auditing
    try {
      await ImportLog.create({ uploadedBy: req.user?.email || req.userId, fileName: req.file.originalname, summary: { created: report.created, updated: report.updated, errors: report.errors.length, rawErrors: report.errors } });
    } catch (logErr) {
      console.error('Failed to save import log:', logErr);
    }

    res.status(200).json({ message: 'Import completed', report: { created: report.created, updated: report.updated, errors: report.errors } });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import products' });
  }
});

export default router;
