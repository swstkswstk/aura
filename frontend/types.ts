
export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  channel?: 'web' | 'whatsapp' | 'telegram' | 'email';
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'customer';
  email?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  preferences?: string[];
  savedCart?: CartItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'Lead' | 'Active' | 'VIP' | 'At Risk';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  preferredNotes: string[];
  lastInteraction: Date;
  messages: Message[];
  orders?: Order[];
  summary?: string;
  nextAction?: string;
}

export type ProductType =
  | 'EDP'
  | 'Extrait'
  | 'Cologne'
  | 'Roll-on'
  | 'Candle'
  | 'Incense'
  | 'Diffuser'
  | 'Backflow Stand'
  | 'Backflow'
  | 'Car Perfume'
  | 'Dhoop Cones'
  | 'Dhoop Sticks'
  | 'Floor Cleaner'
  | 'Air Freshner'
  | 'Air Freshener'
  | 'Pain Oil'
  | 'Essential Oil'
  | 'Diffuser Oil';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "50ml Bottle", "Travel Spray"
  type: ProductType;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Fine Fragrance' | 'Home Collection' | 'Accessories';
  notes: string[];
  image: string;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  sku?: string;
  quantity: number;
  productName: string;
  variantName: string;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: Date;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
  targetSegment: 'All' | 'VIP' | 'Active' | 'Lead' | 'At Risk';
  subject: string;
  content: string;
  scheduledDate: Date;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

// Admin Order type with user details
export interface AdminOrder extends Order {
  userId: string;
  userEmail: string;
  userName: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'bundle' | 'discount';
  products: string[]; // product IDs
  discountPercentage: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}



export type ViewMode = 'landing' | 'shop' | 'crm' | 'auth' | 'profile' | 'about' | 'journal' | 'offers';

export interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
}
