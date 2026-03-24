import mongoose from 'mongoose';
import Product, { IProduct, IProductVariant, ProductCategory, ProductType } from '../models/Product.js';

type VariantInput = Partial<IProductVariant> & {
  id?: string;
};

type ProductInput = {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  notes?: unknown;
  image?: unknown;
  variants?: VariantInput[];
};

type VariantWithOptionalId = IProductVariant & {
  _id?: mongoose.Types.ObjectId;
  toObject?: () => Partial<IProductVariant> & { _id?: mongoose.Types.ObjectId };
};

export function normalizeProductCategory(category: unknown): ProductCategory {
  if (category === 'Home Collection' || category === 'Accessories') {
    return category;
  }

  return 'Fine Fragrance';
}

export function normalizeProductType(type: unknown): ProductType {
  if (typeof type === 'string' && type.trim()) {
    return type as ProductType;
  }

  return 'EDP';
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function normalizeNotes(notes: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(notes)) {
    return notes
      .map((note) => normalizeString(note))
      .filter(Boolean);
  }

  if (typeof notes === 'string') {
    return notes
      .split(',')
      .map((note) => note.trim())
      .filter(Boolean);
  }

  return fallback;
}

function toPlainVariant(variant: VariantWithOptionalId): Partial<IProductVariant> & {
  _id?: mongoose.Types.ObjectId;
} {
  if (typeof variant.toObject === 'function') {
    return variant.toObject();
  }

  return { ...variant };
}

export async function ensureProductVariantIds(product: IProduct): Promise<void> {
  let changed = false;

  const normalizedVariants = product.variants.map((variant) => {
    const plainVariant = toPlainVariant(variant as VariantWithOptionalId);

    if (plainVariant._id) {
      return plainVariant;
    }

    changed = true;

    return {
      ...plainVariant,
      _id: new mongoose.Types.ObjectId(),
    };
  });

  if (!changed) {
    return;
  }

  product.set('variants', normalizedVariants);

  await Product.updateOne(
    { _id: product._id },
    { $set: { variants: normalizedVariants } },
  );
}

export function buildProductWritePayload(
  input: ProductInput,
  existingProduct?: IProduct,
) {
  const existingVariants = existingProduct?.variants ?? [];
  const rawVariants = Array.isArray(input.variants) ? input.variants : [];

  const variants = rawVariants.map((variant) => {
    const incomingId = normalizeString(variant.id);
    const sku = normalizeString(variant.sku);
    const matchingVariant = existingVariants.find((currentVariant) => (
      (incomingId && currentVariant._id?.toString() === incomingId) ||
      (sku && currentVariant.sku === sku)
    ));

    const variantId = matchingVariant?._id
      ?? (incomingId && mongoose.isValidObjectId(incomingId)
        ? new mongoose.Types.ObjectId(incomingId)
        : new mongoose.Types.ObjectId());

    return {
      _id: variantId,
      name: normalizeString(variant.name, sku || 'Variant'),
      type: normalizeProductType(variant.type),
      price: normalizeNumber(variant.price),
      stock: Math.floor(normalizeNumber(variant.stock)),
      sku,
    };
  });

  return {
    name: normalizeString(input.name, existingProduct?.name ?? ''),
    description: normalizeString(input.description, existingProduct?.description ?? ''),
    category: normalizeProductCategory(input.category ?? existingProduct?.category),
    notes: normalizeNotes(input.notes, existingProduct?.notes ?? []),
    image: normalizeString(input.image, existingProduct?.image ?? ''),
    variants,
  };
}

export function validateProductWritePayload(payload: ReturnType<typeof buildProductWritePayload>): string[] {
  const errors: string[] = [];

  if (!payload.name) {
    errors.push('Product name is required');
  }

  if (!payload.description) {
    errors.push('Product description is required');
  }

  if (!payload.image) {
    errors.push('Product image is required');
  }

  if (!payload.variants.length) {
    errors.push('At least one product variant is required');
  }

  const seenSkus = new Set<string>();

  payload.variants.forEach((variant, index) => {
    if (!variant.name) {
      errors.push(`Variant ${index + 1} name is required`);
    }

    if (!variant.sku) {
      errors.push(`Variant ${index + 1} SKU is required`);
    }

    if (variant.sku && seenSkus.has(variant.sku)) {
      errors.push(`Duplicate SKU found: ${variant.sku}`);
    }

    if (variant.sku) {
      seenSkus.add(variant.sku);
    }
  });

  return errors;
}

export function serializeProduct(product: IProduct) {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    category: normalizeProductCategory(product.category),
    notes: product.notes,
    image: product.image,
    variants: product.variants.map((variant) => {
      if (!variant._id) {
        throw new Error(`Product ${product._id.toString()} has a variant without an _id`);
      }

      return {
        id: variant._id.toString(),
        name: variant.name,
        type: variant.type,
        price: variant.price,
        stock: variant.stock,
        sku: variant.sku,
      };
    }),
  };
}
