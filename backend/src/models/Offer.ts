import mongoose, { Document, Schema } from 'mongoose';
import { IProduct } from './Product';

export type OfferType = 'bundle' | 'discount';

export interface IOffer extends Document {
  title: string;
  description: string;
  type: OfferType;
  products: mongoose.Types.ObjectId[] | IProduct[];
  discountPercentage: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['bundle', 'discount'],
      required: true,
    },
    products: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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

offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Offer = mongoose.model<IOffer>('Offer', offerSchema);

export default Offer;
