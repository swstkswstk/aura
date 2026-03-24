
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Calendar, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

interface ConciergeProps {
  onOpenChat: () => void;
}

export const Concierge: React.FC<ConciergeProps> = ({ onOpenChat }) => {
  return (
    <div className="bg-brand-900 min-h-screen text-brand-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-700 bg-brand-800/50 text-xs font-medium text-brand-200 tracking-wide uppercase">
              <Sparkles size={12} /> Private Client Services
            </div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
              A Personal Guide <br/> to the Ethereal.
            </h1>
            <p className="text-brand-200 text-lg max-w-lg leading-relaxed">
              Navigating the world of fine fragrance is a journey best taken with a guide. 
              Our dedicated concierge team combines AI precision with human artistry to curate your signature scent wardrobe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onOpenChat}
                className="flex items-center justify-center gap-3 bg-white text-brand-900 px-8 py-4 rounded-full font-medium hover:bg-brand-100 transition duration-300"
              >
                <MessageCircle size={20} /> Start Live Consultation
              </button>
              <button className="flex items-center justify-center gap-3 border border-brand-700 text-brand-100 px-8 py-4 rounded-full font-medium hover:bg-brand-800 transition duration-300">
                <Calendar size={20} /> Book Appointment
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-brand-800/50">
               <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-transparent to-transparent opacity-60 z-10"></div>
               <img 
                 src="https://images.unsplash.com/photo-1600609842388-4e3a09a5c8df?q=80&w=2574&auto=format&fit=crop" 
                 alt="Concierge Service" 
                 className="w-full h-full object-cover grayscale mix-blend-luminosity hover:grayscale-0 transition duration-1000"
               />
               <div className="absolute bottom-8 left-8 right-8 z-20">
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-200 border-2 border-brand-900 p-0.5">
                        <img src="https://ui-avatars.com/api/?name=Jean+Claude&background=random" className="w-full h-full rounded-full" alt="Stylist"/>
                      </div>
                      <div>
                        <p className="text-white font-medium">Jean-Claude E.</p>
                        <p className="text-brand-300 text-xs uppercase tracking-wider">Senior Nose</p>
                      </div>
                    </div>
                    <p className="text-brand-100 italic font-serif text-lg">
                      "I believe the 'Midnight Saffron' would complement your evening collection perfectly, Madame."
                    </p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-brand-800/30 border border-brand-800 p-8 rounded-2xl hover:bg-brand-800/50 transition duration-300">
             <div className="w-12 h-12 bg-brand-700 rounded-full flex items-center justify-center text-brand-200 mb-6">
                <UserCheck size={24} />
             </div>
             <h3 className="font-serif text-2xl text-white mb-3">Scent Profiling</h3>
             <p className="text-brand-300 mb-6 leading-relaxed">
               Through a series of sensory questions, we map your olfactory preferences to discover notes that resonate with your memories and chemistry.
             </p>
             <a href="#" className="inline-flex items-center gap-2 text-brand-200 text-sm font-bold uppercase tracking-wider hover:text-white transition">
               Learn More <ArrowRight size={16} />
             </a>
          </div>
          
          <div className="bg-brand-800/30 border border-brand-800 p-8 rounded-2xl hover:bg-brand-800/50 transition duration-300">
             <div className="w-12 h-12 bg-brand-700 rounded-full flex items-center justify-center text-brand-200 mb-6">
                <Sparkles size={24} />
             </div>
             <h3 className="font-serif text-2xl text-white mb-3">Bespoke Gifting</h3>
             <p className="text-brand-300 mb-6 leading-relaxed">
               The ultimate gesture. Allow us to curate a custom discovery set or engrave a bottle for your recipient. Wrapped in our signature silk.
             </p>
             <a href="#" className="inline-flex items-center gap-2 text-brand-200 text-sm font-bold uppercase tracking-wider hover:text-white transition">
               View Options <ArrowRight size={16} />
             </a>
          </div>

          <div className="bg-brand-800/30 border border-brand-800 p-8 rounded-2xl hover:bg-brand-800/50 transition duration-300">
             <div className="w-12 h-12 bg-brand-700 rounded-full flex items-center justify-center text-brand-200 mb-6">
                <MessageCircle size={24} />
             </div>
             <h3 className="font-serif text-2xl text-white mb-3">Priority Access</h3>
             <p className="text-brand-300 mb-6 leading-relaxed">
               Concierge clients receive early access to limited edition harvests and private blending workshops held in our ateliers.
             </p>
             <a href="#" className="inline-flex items-center gap-2 text-brand-200 text-sm font-bold uppercase tracking-wider hover:text-white transition">
               Join List <ArrowRight size={16} />
             </a>
          </div>
        </div>

      </div>
    </div>
  );
};
