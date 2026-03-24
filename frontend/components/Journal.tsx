
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, User } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Alchemical Process of Oud',
    excerpt: 'Deep within the agarwood trees of Southeast Asia lies a resin more precious than gold. We explore the years of patience required to harvest this dark, complex note.',
    image: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae8?q=80&w=2671&auto=format&fit=crop',
    date: 'Oct 12, 2023',
    author: 'Isabella V.',
    category: 'Ingredients'
  },
  {
    id: '2',
    title: 'Layering: Creating Your Personal Accord',
    excerpt: 'Why settle for one scent when you can create a symphony? A guide to combining our "Verte Fern" with "Azure Citrus" for a transitional day-to-night signature.',
    image: 'https://images.unsplash.com/photo-1596438248879-1af603b57366?q=80&w=2670&auto=format&fit=crop',
    date: 'Sep 28, 2023',
    author: 'Marc D.',
    category: 'Rituals'
  },
  {
    id: '3',
    title: 'A Winter in Kyoto',
    excerpt: 'Inspiration comes from silence. Our founder shares her travel diary from Japan, where the scent of incense and falling snow inspired our latest home collection.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2670&auto=format&fit=crop',
    date: 'Sep 15, 2023',
    author: 'Elise A.',
    category: 'Travel'
  }
];

export const Journal: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-500 uppercase tracking-widest text-xs font-bold"
          >
            Editorial
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl text-brand-900 mt-4 mb-6"
          >
            The Olfactory Journal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-brand-600 max-w-2xl mx-auto text-lg font-light"
          >
            Stories of ingredients, travel, and the hidden language of scent.
          </motion.p>
        </div>

        {/* Featured Article (First one) */}
        <div className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group cursor-pointer grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="aspect-[16/9] lg:aspect-auto lg:h-[500px] overflow-hidden rounded-2xl">
              <img 
                src={ARTICLES[0].image} 
                alt={ARTICLES[0].title}
                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-xs font-medium text-brand-400 uppercase tracking-wider">
                <span className="text-brand-600 bg-brand-50 px-2 py-1 rounded">{ARTICLES[0].category}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {ARTICLES[0].date}</span>
              </div>
              <h2 className="font-serif text-4xl text-brand-900 group-hover:text-brand-700 transition">
                {ARTICLES[0].title}
              </h2>
              <p className="text-brand-600 text-lg leading-relaxed line-clamp-3">
                {ARTICLES[0].excerpt}
              </p>
              <div className="flex items-center gap-2 text-brand-800 font-medium group-hover:gap-4 transition-all">
                Read Full Story <ArrowRight size={18} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {ARTICLES.slice(1).map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (index * 0.1) }}
              className="group cursor-pointer flex flex-col h-full"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl mb-6 bg-gray-100">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">
                  <span className="text-brand-600">{article.category}</span>
                  <span>•</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-serif text-2xl text-brand-900 mb-3 group-hover:text-brand-700 transition">
                  {article.title}
                </h3>
                <p className="text-brand-600 leading-relaxed mb-6 line-clamp-3 flex-1">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between border-t border-brand-100 pt-4 mt-auto">
                   <div className="flex items-center gap-2 text-xs text-brand-500">
                      <User size={12} /> {article.author}
                   </div>
                   <span className="text-brand-800 text-sm font-medium hover:underline">Read</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};
