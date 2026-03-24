import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  phone?: string;
  avatar?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  preferences?: {
    notes: string[];
    categories: string[];
  };
  savedCart?: Array<{
    productId: string;
    variantId: string;
    sku?: string;
    quantity: number;
    productName: string;
    variantName: string;
    price: number;
    image: string;
  }>;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    preferences: {
      notes: [String],
      categories: [String],
    },
    savedCart: [
      {
        productId: {
          type: String,
          required: true,
          trim: true,
        },
        variantId: {
          type: String,
          required: true,
          trim: true,
        },
        sku: {
          type: String,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        productName: {
          type: String,
          required: true,
          trim: true,
        },
        variantName: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        image: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    otp: {
      code: String,
      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Note: Index on email is already created by unique: true in schema

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
