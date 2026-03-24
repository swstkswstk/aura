import React from 'react';
import { motion } from 'framer-motion';
import { Tag, ShoppingBag, Gift, ArrowRight } from 'lucide-react';
import { Product, CartItem } from '../types';

interface OffersProps {
  products: Product[];
  onAddToCart: (item: CartItem) => void;
}

const formatPrice = (value?: number) =>
  value == null
    ? '₹0'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export const Offers: React.FC<OffersProps> = ({ products, onAddToCart }) => {
  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="text-center text-brand-400">
          <Tag size={48} className="mx-auto mb-4 opacity-50" />
          <p>Loading offers...</p>
        </div>
      </div>
    );
  }

  const primary = products[0];
  const secondary = products[1];
  const tertiary = products[2];

  const handleAddBundle = (product: Product | undefined, discountPercent = 0) => {
    if (!product) return;
    const variant = product.variants?.[0];
    if (!variant) return;

    const basePrice = variant.price ?? 0;
    const price = Math.round(basePrice * (1 - discountPercent / 100));

    const item: CartItem = {
      productId: product.id,
      variantId: variant.id,
      sku: variant.sku,
      quantity: 1,
      productName: `${product.name} ${discountPercent > 0 ? `(Save ${discountPercent}%)` : '(Special Offer)'}`,
      variantName: variant.name,
      price,
      image: product.image ?? '',
    };

    onAddToCart(item);
  };

  return (
    <div className="bg-brand-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-brand-500 uppercase tracking-widest text-xs font-bold">
            Exclusive Privileges
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-serif text-5xl text-brand-900 mt-4 mb-6">
            Seasonal Offers
          </motion.h1>
          <p className="text-brand-600 max-w-2xl mx-auto text-lg font-light">
            Curated bundles and limited-time privileges for our inner circle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100 group">
            <div className="bg-brand-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12">
                <Gift size={100} />
              </div>
              <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Bundle Deal
              </span>
              <h3 className="font-serif text-2xl mb-2">The Signature Set</h3>
              <p className="text-brand-200 text-sm">Experience our best-selling eau de parfum with a complimentary travel spray.</p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <img src={primary.image ?? ''} alt={primary.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-brand-900">{primary.name}</h4>
                  <p className="text-xs text-brand-500">Plus complimentary 10ml vial</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-brand-50 pt-4">
                <div>
                  <span className="block text-xs text-brand-400 line-through">{formatPrice(Math.round((primary.variants?.[0]?.price ?? 0) * 1.2))}</span>
                  <span className="block text-xl font-serif text-brand-900">{formatPrice(primary.variants?.[0]?.price)}</span>
                </div>

                <button
                  onClick={() => handleAddBundle(primary)}
                  aria-label={`Add signature set ${primary.name} to cart`}
                  className="bg-brand-100 text-brand-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-200 transition flex items-center gap-2"
                >
                  Add Set <ShoppingBag size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {[secondary, tertiary].filter(Boolean).map((product, idx) => {
            if (!product) return null;
            const discount = 15;
            const basePrice = product.variants?.[0]?.price ?? 0;
            const salePrice = Math.round(basePrice * (1 - discount / 100));
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100 flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img src={product.image ?? ''} alt={product.name} className="w-full h-full object-cover transition duration-700 hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {discount}% OFF
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-serif text-xl text-brand-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-brand-500 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-brand-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-400 line-through">{formatPrice(basePrice)}</span>
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">-{discount}%</span>
                      </div>
                      <span className="block text-xl font-serif text-brand-900">{formatPrice(salePrice)}</span>
                    </div>

                    <button
                      onClick={() => handleAddBundle(product, discount)}
                      aria-label={`Claim ${product.name} offer`}
                      className="bg-brand-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition flex items-center gap-2 shadow-lg shadow-brand-900/10"
                    >
                      Claim <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
