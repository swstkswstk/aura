import mongoose, { Document, Schema } from 'mongoose';

export type ProductType = 'EDP' | 'Extrait' | 'Cologne' | 'Roll-on' | 'Candle' | 'Incense' | 'Diffuser' | 'Car Perfume';
export type ProductCategory = 'Fine Fragrance' | 'Home Collection' | 'Accessories';
export type StoredProductCategory = ProductCategory | 'Fragrances';

export interface IProductVariant {
  _id?: mongoose.Types.ObjectId;
  name: string;
  type: ProductType;
  price: number;
  stock: number;
  sku: string;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: StoredProductCategory;
  notes: string[];
  image: string;
  variants: IProductVariant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['EDP', 'Extrait', 'Cologne', 'Roll-on', 'Candle', 'Incense', 'Diffuser', 'Backflow Stand', 'Backflow', 'Car Perfume', 'Dhoop Cones', 'Dhoop Sticks', 'Floor Cleaner', 'Air Freshner', 'Pain Oil', 'Essential Oil', 'Diffuser Oil'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
    },
  },
  {
    _id: true,
  }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Fine Fragrance', 'Fragrances', 'Home Collection', 'Accessories'],
      required: true,
    },
    notes: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      required: true,
    },
    variants: {
      type: [productVariantSchema],
      required: true,
      validate: {
        validator: function (v: IProductVariant[]) {
          return v.length > 0;
        },
        message: 'Product must have at least one variant',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster category lookups
productSchema.index({ category: 1, isActive: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
