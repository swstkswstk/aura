import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Check, Star } from 'lucide-react';
import { Product, ProductVariant, CartItem } from '../types';

interface ShopProps {
  products: Product[];
  onAddToCart: (item: CartItem) => void;
  isLoading?: boolean;
}

export const Shop: React.FC<ShopProps> = ({ products, onAddToCart, isLoading = false }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const categories = ['All', 'Fine Fragrance', 'Home Collection', 'Accessories'];
  
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants[0] || null);
  };

  const handleAddToCart = () => {
    if (selectedProduct && selectedVariant) {
      onAddToCart({
        productId: selectedProduct.id,
        variantId: selectedVariant.id,
        sku: selectedVariant.sku,
        quantity: 1,
        productName: selectedProduct.name,
        variantName: selectedVariant.name,
        price: selectedVariant.price,
        image: selectedProduct.image
      });
      setSelectedProduct(null);
    }
  };

  return (
    <div className="bg-brand-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="font-serif text-4xl text-brand-900 mb-8 text-center">The Boutique</h1>
        <div className="flex justify-center gap-4 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${activeCategory === cat 
                  ? 'bg-brand-800 text-white shadow-lg' 
                  : 'bg-white text-brand-600 hover:bg-brand-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-brand-600 font-medium">Loading products...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="text-center text-brand-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No products found</p>
            <p className="text-sm mt-2">Check back later for new arrivals</p>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map(product => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            onClick={() => openProduct(product)}
            className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                <span className="inline-block bg-white/90 backdrop-blur text-brand-900 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider">
                  View Details
                </span>
              </div>
            </div>
            <div className="p-6 text-center">
              <h3 className="font-serif text-xl text-brand-900 mb-1">{product.name}</h3>
              <p className="text-xs text-brand-400 uppercase tracking-widest mb-3">
                {product.category}
              </p>
              <p className="text-brand-700 font-medium">
                From ₹{Math.min(...product.variants.map(v => v.price))}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/50 rounded-full hover:bg-white transition"
              >
                <X size={24} className="text-brand-900" />
              </button>

              <div className="w-full md:w-1/2 bg-gray-100">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                <div className="mb-6">
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                    {selectedProduct.category}
                  </span>
                  <h2 className="font-serif text-4xl text-brand-900 mt-2 mb-4">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-brand-600 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                  <div className="flex gap-2 mt-4">
                    {selectedProduct.notes.map(note => (
                      <span key={note} className="text-xs px-2 py-1 bg-brand-50 text-brand-600 rounded-md border border-brand-100">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-900 mb-3">Select Variant</label>
                    <div className="space-y-2">
                      {selectedProduct.variants.map(variant => (
                        <div 
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-4 rounded-lg border cursor-pointer flex justify-between items-center transition
                            ${selectedVariant?.id === variant.id 
                              ? 'border-brand-800 bg-brand-50' 
                              : 'border-brand-200 hover:border-brand-400'
                            }`}
                        >
                          <div>
                            <span className="block font-medium text-brand-900">{variant.name}</span>
                            <span className="text-xs text-brand-500 uppercase tracking-wider">{variant.type}</span>
                          </div>
                          <div className="text-right">
                             <span className="block font-bold text-brand-900">₹{variant.price}</span>
                             {variant.stock < 10 && (
                               <span className="text-[10px] text-red-500 font-medium">
                                 Only {variant.stock} left
                               </span>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    className="w-full bg-brand-900 text-white py-4 rounded-lg font-medium text-lg hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {selectedVariant?.stock === 0 ? 'Out of Stock' : (
                      <>
                        <ShoppingBag size={20} />
                        Add to Cart - ₹{selectedVariant?.price}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
