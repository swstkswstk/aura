import { Product, Customer } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Midnight Saffron',
    description: 'A mysterious blend of rare saffron, dark rose, and agarwood.',
    category: 'Fine Fragrance',
    notes: ['Saffron', 'Rose', 'Oud'],
    image: 'https://picsum.photos/400/500?random=1',
    variants: [
      { id: 'v1_1', name: '50ml Eau de Parfum', type: 'EDP', price: 185, stock: 45, sku: 'MS-EDP-50' },
      { id: 'v1_2', name: '10ml Roll-on Oil', type: 'Roll-on', price: 65, stock: 120, sku: 'MS-OIL-10' },
      { id: 'v1_3', name: 'Extrait de Parfum', type: 'Extrait', price: 240, stock: 15, sku: 'MS-EXT-50' }
    ]
  },
  {
    id: '2',
    name: 'Verte Fern',
    description: 'The crisp morning air captured in a bottle. Green, fresh, and alive.',
    category: 'Fine Fragrance',
    notes: ['Fern', 'Bergamot', 'Moss'],
    image: 'https://picsum.photos/400/500?random=2',
    variants: [
      { id: 'v2_1', name: '100ml Cologne', type: 'Cologne', price: 145, stock: 30, sku: 'VF-COL-100' },
      { id: 'v2_2', name: 'Car Diffuser', type: 'Car Perfume', price: 45, stock: 200, sku: 'VF-CAR-01' }
    ]
  },
  {
    id: '3',
    name: 'Velvet Amber',
    description: 'Warm, enveloping, and undeniably sensual. A hug in fragrance form.',
    category: 'Home Collection',
    notes: ['Amber', 'Vanilla', 'Musk'],
    image: 'https://picsum.photos/400/500?random=3',
    variants: [
      { id: 'v3_1', name: 'Soy Wax Candle', type: 'Candle', price: 65, stock: 80, sku: 'VA-CND-300' },
      { id: 'v3_2', name: 'Reed Diffuser', type: 'Diffuser', price: 85, stock: 50, sku: 'VA-DIF-200' },
      { id: 'v3_3', name: 'Incense Sticks (20)', type: 'Incense', price: 35, stock: 150, sku: 'VA-INC-20' }
    ]
  },
  {
    id: '4',
    name: 'Azure Citrus',
    description: 'Sparkling lemon and sea salt reminiscent of the Amalfi coast.',
    category: 'Fine Fragrance',
    notes: ['Lemon', 'Sea Salt', 'Cedar'],
    image: 'https://picsum.photos/400/500?random=4',
    variants: [
      { id: 'v4_1', name: '50ml Eau de Parfum', type: 'EDP', price: 130, stock: 60, sku: 'AC-EDP-50' }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Elena Fisher',
    email: 'elena@example.com',
    phone: '+1 (555) 0123',
    avatar: 'https://picsum.photos/100/100?random=10',
    status: 'VIP',
    sentiment: 'Positive',
    preferredNotes: ['Jasmine', 'Sandalwood'],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    messages: [
      { id: 'm1', sender: 'user', content: 'I love the new sample kit!', timestamp: new Date(), channel: 'whatsapp' },
      { id: 'm2', sender: 'agent', content: 'We are delighted to hear that, Elena!', timestamp: new Date(), channel: 'whatsapp' }
    ],
    orders: []
  },
  {
    id: 'c2',
    name: 'Marc Johnson',
    email: 'marc@example.com',
    phone: '+1 (555) 0124',
    avatar: 'https://picsum.photos/100/100?random=11',
    status: 'Active',
    sentiment: 'Neutral',
    preferredNotes: ['Cedar', 'Leather'],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    messages: [
      { id: 'm3', sender: 'user', content: 'Is the shipping usually this slow?', timestamp: new Date(), channel: 'email' },
      { id: 'm4', sender: 'agent', content: 'Hi Marc, let me check your order status.', timestamp: new Date(), channel: 'email' }
    ],
    orders: []
  },
  {
    id: 'c3',
    name: 'Sophie Wu',
    email: 'sophie@example.com',
    phone: '+1 (555) 0125',
    avatar: 'https://picsum.photos/100/100?random=12',
    status: 'Lead',
    sentiment: 'Positive',
    preferredNotes: [],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    messages: [
      { id: 'm5', sender: 'user', content: 'Do you have anything that smells like rain?', timestamp: new Date(), channel: 'telegram' }
    ],
    orders: []
  }
];
