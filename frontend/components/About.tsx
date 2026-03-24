
import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Globe, Heart } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="bg-brand-50 min-h-screen">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop" 
            alt="Perfume bottle in nature" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-brand-900/30 mix-blend-multiply" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl mb-6 italic"
          >
            The Art of Aura
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl font-light text-brand-100 max-w-2xl mx-auto"
          >
            Where ancient alchemy meets modern sensibility.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span className="text-brand-500 uppercase tracking-widest text-xs font-bold">Our Philosophy</span>
            <h2 className="font-serif text-4xl text-brand-900">Scent is Memory</h2>
            <p className="text-brand-700 leading-relaxed text-lg">
              At Aura Parfumerie, we believe that fragrance is not merely an accessory, but a vessel for time travel. A single note can transport you to a forgotten summer, a lover's embrace, or a walk through a cedar forest after rain.
            </p>
            <p className="text-brand-600 leading-relaxed">
              Founded in 2023, our maison was born from a desire to return to slow perfumery. We reject mass production in favor of small-batch artistry, ensuring that every bottle containing our elixir is as unique as the individual who wears it.
            </p>
            <div className="pt-4">
              <img 
                src="https://fontmeme.com/permalink/250225/signature-font.png" 
                alt="Founder Signature" 
                className="h-12 opacity-60" 
              />
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=2574&auto=format&fit=crop" 
                alt="Perfumer working" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-lg shadow-xl max-w-xs border border-brand-100 hidden md:block">
              <p className="font-serif italic text-brand-800 text-lg">"We bottle the ethereal."</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="p-8 rounded-2xl bg-brand-50/50 hover:bg-brand-50 transition duration-300">
              <div className="w-16 h-16 bg-brand-200 rounded-full flex items-center justify-center text-brand-800 mx-auto mb-6">
                <Globe size={28} />
              </div>
              <h3 className="font-serif text-xl text-brand-900 mb-3">Sustainable Sourcing</h3>
              <p className="text-brand-600">We partner directly with growers in Grasse, Mysore, and Calabria to ensure ethical harvesting practices.</p>
            </div>
            <div className="p-8 rounded-2xl bg-brand-50/50 hover:bg-brand-50 transition duration-300">
              <div className="w-16 h-16 bg-brand-200 rounded-full flex items-center justify-center text-brand-800 mx-auto mb-6">
                <Droplet size={28} />
              </div>
              <h3 className="font-serif text-xl text-brand-900 mb-3">Pure Absolutes</h3>
              <p className="text-brand-600">Our extraits contain the highest concentration of essential oils, lasting up to 12 hours on the skin.</p>
            </div>
            <div className="p-8 rounded-2xl bg-brand-50/50 hover:bg-brand-50 transition duration-300">
              <div className="w-16 h-16 bg-brand-200 rounded-full flex items-center justify-center text-brand-800 mx-auto mb-6">
                <Heart size={28} />
              </div>
              <h3 className="font-serif text-xl text-brand-900 mb-3">Cruelty Free</h3>
              <p className="text-brand-600">Beauty should not come at a cost. We never test on animals and our formulations are 100% vegan.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
