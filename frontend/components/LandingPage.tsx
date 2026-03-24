import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Droplet, Wind } from 'lucide-react';
import { Product, CartItem, ViewMode } from '../types';

interface LandingPageProps {
  products: Product[];
  onAddToCart: (item: CartItem) => void;
  onNavigate: (view: ViewMode) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ products, onAddToCart, onNavigate }) => {
  return (
    <div className="bg-brand-50">
      {/* Hero Section */}
      <section className="relative h-[85vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2574&auto=format&fit=crop" 
          alt="Abstract perfume smoke" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="block font-serif italic text-xl md:text-2xl mb-4 tracking-wider"
          >
            Essence of Identity
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 leading-tight"
          >
            Find Your <br/> Signature Aura
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-brand-100 text-lg md:text-xl font-light mb-10 max-w-2xl mx-auto"
          >
            A bespoke fragrance journey shaped by rare ingredients, layered accords, and a collection designed to be worn with intention.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button 
              onClick={() => onNavigate('shop')}
              className="px-8 py-4 bg-white text-brand-900 rounded-full font-medium tracking-wide hover:bg-brand-100 transition duration-300"
            >
              Discover Collection
            </button>
            <button 
              onClick={() => onNavigate('offers')}
              className="px-8 py-4 border border-white text-white rounded-full font-medium tracking-wide hover:bg-white/10 transition duration-300 backdrop-blur-sm"
            >
              Explore Offers
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features / Value Prop */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-800 mb-6">
              <Droplet size={28} />
            </div>
            <h3 className="font-serif text-2xl text-brand-900 mb-3">Rare Ingredients</h3>
            <p className="text-brand-600 leading-relaxed">Sourced from the most secluded gardens of the world, ensuring purity and potency in every drop.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-800 mb-6">
              <Wind size={28} />
            </div>
            <h3 className="font-serif text-2xl text-brand-900 mb-3">Personalized Sillage</h3>
            <p className="text-brand-600 leading-relaxed">Build a scent wardrobe across perfume, home, and accessory layers that fit your routine and mood.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-800 mb-6">
              <Star size={28} />
            </div>
            <h3 className="font-serif text-2xl text-brand-900 mb-3">Loyalty Reimagined</h3>
            <p className="text-brand-600 leading-relaxed">Join our inner circle. Seamlessly manage your collection and reorders via WhatsApp or Telegram.</p>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-24 px-4 bg-brand-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-brand-500 uppercase tracking-widest text-sm font-semibold">The Collection</span>
              <h2 className="font-serif text-4xl text-brand-900 mt-2">Curated for the Season</h2>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 text-brand-800 hover:text-brand-600 transition font-medium">
              View All <ArrowRight size={18} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg mb-4 bg-gray-200">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const variant = product.variants[0];
                        if (variant) {
                          onAddToCart({
                            productId: product.id,
                            variantId: variant.id,
                            sku: variant.sku,
                            quantity: 1,
                            productName: product.name,
                            variantName: variant.name,
                            price: variant.price,
                            image: product.image
                          });
                        }
                      }}
                      className="bg-white text-brand-900 px-6 py-3 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-lg"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
                <h3 className="font-serif text-xl text-brand-900">{product.name}</h3>
                <p className="text-brand-500 text-sm mt-1">{product.notes.join(' • ')}</p>
                <p className="text-brand-800 font-medium mt-2">
                  From ₹{Math.min(...product.variants.map(v => v.price))}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <a href="#" className="inline-flex items-center gap-2 text-brand-800 hover:text-brand-600 transition font-medium">
              View All <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Omni-channel CTA */}
      <section className="py-24 bg-brand-900 text-brand-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl mb-6">Never miss a note.</h2>
              <p className="text-brand-200 text-lg mb-8 leading-relaxed">
                Experience the future of luxury retail. Chat with our specialists in real-time, 
                receive restock alerts via WhatsApp, and manage your scent profile—all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="flex items-center gap-3 px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition">
                  <span className="font-bold">WhatsApp</span> Connect
                </button>
                <button className="flex items-center gap-3 px-6 py-3 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b5] transition">
                  <span className="font-bold">Telegram</span> Join
                </button>
              </div>
            </div>
            <div className="relative">
              {/* Abstract phone mockup or similar visual could go here */}
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                 <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-brand-200"></div>
                    <div className="bg-white text-brand-900 p-4 rounded-2xl rounded-tl-none text-sm shadow-lg max-w-xs">
                       <p>Hello! I noticed you enjoyed 'Midnight Saffron'. We have a limited reserve of a similar oud arriving next week. Shall I reserve one for you?</p>
                    </div>
                 </div>
                 <div className="flex items-end justify-end gap-4">
                    <div className="bg-[#DCF8C6] text-brand-900 p-4 rounded-2xl rounded-tr-none text-sm shadow-lg max-w-xs">
                       <p>Yes, please! Add it to my profile. Same shipping address.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-800 border-2 border-white"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
