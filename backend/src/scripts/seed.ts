import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Seed data - products
const SEED_PRODUCTS = [
  {
    name: 'Midnight Saffron',
    description: 'A mysterious blend of rare saffron, dark rose, and agarwood. This opulent fragrance opens with the golden warmth of Persian saffron, melding into the velvety depth of Turkish rose, and settling into a base of precious oud.',
    category: 'Fine Fragrance',
    notes: ['Saffron', 'Rose', 'Oud'],
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop',
    variants: [
      { name: '50ml Eau de Parfum', type: 'EDP', price: 185, stock: 45, sku: 'MS-EDP-50' },
      { name: '10ml Roll-on Oil', type: 'Roll-on', price: 65, stock: 120, sku: 'MS-OIL-10' },
      { name: 'Extrait de Parfum', type: 'Extrait', price: 240, stock: 15, sku: 'MS-EXT-50' }
    ]
  },
  {
    name: 'Verte Fern',
    description: 'The crisp morning air captured in a bottle. Green, fresh, and alive. This invigorating cologne evokes walks through dewy forests at dawn, with notes of crushed fern fronds and aromatic moss.',
    category: 'Fine Fragrance',
    notes: ['Fern', 'Bergamot', 'Moss'],
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=500&fit=crop',
    variants: [
      { name: '100ml Cologne', type: 'Cologne', price: 145, stock: 30, sku: 'VF-COL-100' },
      { name: 'Car Diffuser', type: 'Car Perfume', price: 45, stock: 200, sku: 'VF-CAR-01' }
    ]
  },
  {
    name: 'Velvet Amber',
    description: 'Warm, enveloping, and undeniably sensual. A hug in fragrance form. This rich home fragrance creates an atmosphere of comfort and sophistication with golden amber and creamy vanilla.',
    category: 'Home Collection',
    notes: ['Amber', 'Vanilla', 'Musk'],
    image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=400&h=500&fit=crop',
    variants: [
      { name: 'Soy Wax Candle', type: 'Candle', price: 65, stock: 80, sku: 'VA-CND-300' },
      { name: 'Reed Diffuser', type: 'Diffuser', price: 85, stock: 50, sku: 'VA-DIF-200' },
      { name: 'Incense Sticks (20)', type: 'Incense', price: 35, stock: 150, sku: 'VA-INC-20' }
    ]
  },
  {
    name: 'Azure Citrus',
    description: 'Sparkling lemon and sea salt reminiscent of the Amalfi coast. This effervescent fragrance captures the essence of Mediterranean summers with bright citrus notes dancing above a base of warm cedar.',
    category: 'Fine Fragrance',
    notes: ['Lemon', 'Sea Salt', 'Cedar'],
    image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&h=500&fit=crop',
    variants: [
      { name: '50ml Eau de Parfum', type: 'EDP', price: 130, stock: 60, sku: 'AC-EDP-50' }
    ]
  },
  {
    name: 'Noir Orchid',
    description: 'Dark, exotic, and utterly captivating. A luxurious blend of black orchid and dark chocolate, finished with hints of patchouli and black truffle. For those who dare to stand out.',
    category: 'Fine Fragrance',
    notes: ['Black Orchid', 'Dark Chocolate', 'Patchouli'],
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=500&fit=crop',
    variants: [
      { name: '50ml Eau de Parfum', type: 'EDP', price: 195, stock: 25, sku: 'NO-EDP-50' },
      { name: 'Extrait de Parfum', type: 'Extrait', price: 280, stock: 10, sku: 'NO-EXT-50' }
    ]
  },
  {
    name: 'Sandalwood Dreams',
    description: 'Creamy Australian sandalwood meets soft white musk in this meditative home fragrance. Perfect for creating a sanctuary of calm and introspection.',
    category: 'Home Collection',
    notes: ['Sandalwood', 'White Musk', 'Cedar'],
    image: 'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=400&h=500&fit=crop',
    variants: [
      { name: 'Luxury Candle (500g)', type: 'Candle', price: 95, stock: 40, sku: 'SD-CND-500' },
      { name: 'Room Spray', type: 'Diffuser', price: 45, stock: 100, sku: 'SD-SPR-200' }
    ]
  }
];

// Seed admin user
const ADMIN_USER = {
  email: 'admin@aura.com',
  name: 'Aura Admin',
  role: 'admin' as const,
};

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Product.deleteMany({});
    await User.deleteMany({ role: 'admin' });

    // Seed products
    console.log('Seeding products...');
    const products = await Product.insertMany(SEED_PRODUCTS);
    console.log(`Seeded ${products.length} products`);

    // Seed admin user
    console.log('Seeding admin user...');
    await User.create(ADMIN_USER);
    console.log('Admin user created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nProducts:');
    products.forEach(p => {
      console.log(`  - ${p.name} (${p.variants.length} variants)`);
    });

    console.log('\nAdmin user:');
    console.log(`  - Email: ${ADMIN_USER.email}`);
    console.log('  - Use this email to login as admin');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run seed
seed();
