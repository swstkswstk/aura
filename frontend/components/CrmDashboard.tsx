
import React, { useState } from 'react';
import { 
  Users, MessageSquare, PieChart, Search, 
  MoreVertical, Mail, Phone, ExternalLink, 
  AlertCircle, CheckCircle, Clock, 
  LayoutDashboard, Megaphone, Package, ShoppingCart,
  TrendingUp, Activity, User as UserIcon, Tag, Send, ShoppingBag
} from 'lucide-react';
import { Customer, Message, Product, Order } from '../types';
import { analyzeCustomerInteraction } from '../services/geminiService';
import { CampaignManager } from './CampaignManager';
import { InventoryManager } from './InventoryManager';
import { OrderManager } from './OrderManager';
import OfferManager from './OfferManager';
import { motion } from 'framer-motion';

interface CrmDashboardProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

type Tab = 'dashboard' | 'campaigns' | 'inventory' | 'orders' | 'offers';

export const CrmDashboard: React.FC<CrmDashboardProps> = ({ 
  customers, setCustomers, products, setProducts, orders, setOrders 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState<'All' | 'VIP' | 'Active' | 'Lead' | 'At Risk'>('All');
  const [replyText, setReplyText] = useState('');

  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) || null : null;
  const filteredCustomers = customers.filter(c => filter === 'All' || c.status === filter);

  const handleAnalyze = async (customer: Customer) => {
    setIsAnalyzing(true);
    const analysis = await analyzeCustomerInteraction(customer.messages);
    
    // Update customer with AI insights
    const updatedCustomer: Customer = {
      ...customer,
      sentiment: analysis.sentiment,
      status: analysis.statusSuggestion,
      preferredNotes: [...new Set([...customer.preferredNotes, ...analysis.extractedPreferences])],
      summary: analysis.summary,
      nextAction: analysis.nextAction
    };

    setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
    setIsAnalyzing(false);
  };

  const handleSendReply = () => {
    if (!selectedCustomerId || !replyText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'agent',
      content: replyText,
      timestamp: new Date(),
      channel: 'web' // Default to web for CRM replies
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          lastInteraction: new Date(),
          messages: [...c.messages, newMessage]
        };
      }
      return c;
    }));
    
    setReplyText('');
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // Helper to calculate LTV
  const calculateLTV = (customer: Customer) => {
    if (!customer.orders) return 0;
    return customer.orders.reduce((sum, order) => sum + order.total, 0);
  };

  // Helper to derive top categories from orders
  const getTopCategories = (customer: Customer) => {
    if (!customer.orders) return [];
    const counts: Record<string, number> = {};
    customer.orders.forEach(o => {
      o.items.forEach(i => {
         const product = products.find(p => p.id === i.productId);
         if (product) {
           counts[product.category] = (counts[product.category] || 0) + i.quantity;
         }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => cat);
  };

  const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
    const colors = {
      Positive: 'bg-green-100 text-green-800 border-green-200',
      Neutral: 'bg-gray-100 text-gray-800 border-gray-200',
      Negative: 'bg-red-100 text-red-800 border-red-200'
    };
    const key = sentiment as keyof typeof colors;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[key] || colors.Neutral}`}>
        {sentiment}
      </span>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      VIP: 'bg-purple-100 text-purple-800',
      Active: 'bg-blue-100 text-blue-800',
      Lead: 'bg-yellow-100 text-yellow-800',
      'At Risk': 'bg-red-100 text-red-800'
    };
    const key = status as keyof typeof colors;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[key] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-brand-50 min-h-[calc(100vh-80px)] p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation / Stats Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
            <h2 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4">Menu</h2>
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'dashboard' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <LayoutDashboard size={18} />
                Customers & Insights
              </button>
              <button 
                onClick={() => setActiveTab('campaigns')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'campaigns' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <Megaphone size={18} />
                Campaigns
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'inventory' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <Package size={18} />
                Inventory
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'orders' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <ShoppingCart size={18} />
                Orders
                {orders.filter(o => o.status === 'Pending').length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {orders.filter(o => o.status === 'Pending').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('offers')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'offers' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <Tag size={18} />
                Offers
              </button>
            </nav>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
            <h2 className="text-lg font-serif font-medium text-brand-900 mb-4">Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-200 rounded-full text-brand-800"><Users size={16}/></div>
                  <span className="text-sm font-medium text-brand-700">Total Customers</span>
                </div>
                <span className="text-lg font-bold text-brand-900">{customers.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-200 rounded-full text-green-800"><CheckCircle size={16}/></div>
                  <span className="text-sm font-medium text-brand-700">Orders Today</span>
                </div>
                <span className="text-lg font-bold text-brand-900">
                  {orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Dynamic */}
        <div className="lg:col-span-9 h-[80vh]">
          {activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-6 h-full">
              {/* List */}
              <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-brand-100">
                  <h2 className="text-lg font-serif font-medium text-brand-900 mb-3">Customers</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full pl-9 pr-4 py-2 bg-brand-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-brand-300"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 p-2 border-b border-brand-50 overflow-x-auto scrollbar-hide">
                  {['All', 'VIP', 'Active', 'Lead', 'At Risk'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${filter === f ? 'bg-brand-100 text-brand-900' : 'text-brand-500 hover:text-brand-700'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="overflow-y-auto flex-1">
                  {filteredCustomers.map(customer => (
                    <div 
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`p-4 flex items-center gap-4 hover:bg-brand-50 cursor-pointer border-b border-brand-50 transition
                        ${selectedCustomerId === customer.id ? 'bg-brand-50 border-l-4 border-l-brand-800' : 'border-l-4 border-l-transparent'}
                      `}
                    >
                      <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-semibold text-brand-900 truncate">{customer.name}</h3>
                          <StatusBadge status={customer.status} />
                        </div>
                        <p className="text-xs text-brand-500 truncate mt-1">
                          Last: {new Date(customer.lastInteraction).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail Profile View */}
              <div className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-brand-100 flex flex-col h-full overflow-hidden">
                {selectedCustomer ? (
                  <>
                    {/* Header */}
                    <div className="p-6 border-b border-brand-100 bg-brand-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                          <div>
                            <h2 className="text-xl font-serif font-medium text-brand-900">{selectedCustomer.name}</h2>
                            <div className="flex gap-2 text-brand-500 mt-1">
                              <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-1 text-xs hover:text-brand-800 transition"><Mail size={12}/> {selectedCustomer.email}</a>
                              <span className="text-brand-200">|</span>
                              <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-1 text-xs hover:text-brand-800 transition"><Phone size={12}/> {selectedCustomer.phone}</a>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                           <StatusBadge status={selectedCustomer.status} />
                           <div><SentimentBadge sentiment={selectedCustomer.sentiment} /></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. AI Insights Summary */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="bg-gradient-to-br from-white to-brand-50 rounded-xl p-5 border border-brand-200 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-brand-100 rounded-full blur-2xl -mr-8 -mt-8 opacity-50"></div>
                             
                             <div className="flex justify-between items-center mb-3 relative z-10">
                                <h3 className="text-sm font-bold text-brand-800 flex items-center gap-2 uppercase tracking-wide">
                                  <SparklesIcon /> AI Insight Summary
                                </h3>
                                <button 
                                  onClick={() => handleAnalyze(selectedCustomer)}
                                  disabled={isAnalyzing}
                                  className="text-[10px] bg-white border border-brand-200 text-brand-600 px-3 py-1 rounded-full hover:bg-brand-50 disabled:opacity-50 transition shadow-sm"
                                >
                                  {isAnalyzing ? 'Analyzing...' : 'Refresh'}
                                </button>
                             </div>
                             
                             <div className="relative z-10 space-y-3">
                                <p className="text-sm text-brand-700 leading-relaxed">
                                  {selectedCustomer.summary || "No detailed analysis generated yet. Click refresh to process interaction history."}
                                </p>
                                
                                {selectedCustomer.nextAction && (
                                  <div className="flex items-start gap-2 bg-white/80 p-3 rounded-lg border border-brand-100">
                                    <TrendingUp size={16} className="text-brand-600 mt-0.5" />
                                    <div>
                                      <span className="text-xs font-bold text-brand-600 block mb-0.5">Recommended Action</span>
                                      <span className="text-xs text-brand-800">{selectedCustomer.nextAction}</span>
                                    </div>
                                  </div>
                                )}
                             </div>
                          </div>
                        </div>

                        {/* 2. Customer Preferences */}
                        <div className="col-span-1">
                          <div className="bg-white p-5 rounded-xl border border-brand-100 h-full shadow-sm">
                            <h3 className="text-sm font-bold text-brand-800 flex items-center gap-2 uppercase tracking-wide mb-4">
                              <Tag size={14} /> Preferences
                            </h3>
                            
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-brand-500 mb-2">Favorite Notes</h4>
                                {selectedCustomer.preferredNotes.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedCustomer.preferredNotes.map(note => (
                                      <span key={note} className="text-xs px-2.5 py-1 bg-brand-50 border border-brand-100 rounded-md text-brand-700 font-medium">
                                        {note}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-brand-400 italic">No notes detected.</p>
                                )}
                            </div>

                            <div className="mb-4">
                               <h4 className="text-xs font-semibold text-brand-500 mb-2">Top Categories</h4>
                               {getTopCategories(selectedCustomer).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {getTopCategories(selectedCustomer).map(cat => (
                                      <span key={cat} className="text-xs px-2.5 py-1 bg-white border border-brand-200 rounded-full text-brand-700 flex items-center gap-1 shadow-sm">
                                        <ShoppingBag size={10} /> {cat}
                                      </span>
                                    ))}
                                  </div>
                               ) : (
                                  <p className="text-xs text-brand-400 italic">No purchase history.</p>
                               )}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-brand-50">
                               <h4 className="text-xs font-semibold text-brand-600 mb-2">Key Stats</h4>
                               <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-[10px] text-brand-400 uppercase">Lifetime Value</span>
                                    <div className="text-lg font-serif text-brand-900">₹{calculateLTV(selectedCustomer).toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-brand-400 uppercase">Avg Order</span>
                                    <div className="text-lg font-serif text-brand-900">
                                      ₹{selectedCustomer.orders?.length ? (calculateLTV(selectedCustomer) / selectedCustomer.orders.length).toFixed(2) : '0.00'}
                                    </div>
                                  </div>
                               </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Communication History */}
                        <div className="col-span-1 md:col-span-2">
                           <div className="bg-white rounded-xl border border-brand-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                              <div className="p-4 border-b border-brand-50 bg-brand-50/30 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-sm font-bold text-brand-800 flex items-center gap-2 uppercase tracking-wide">
                                  <MessageSquare size={14} /> Communication History
                                </h3>
                                <span className="text-xs text-brand-400">{selectedCustomer.messages.length} interactions</span>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {selectedCustomer.messages.slice().reverse().map((msg, idx) => (
                                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] ${msg.sender === 'user' ? 'bg-brand-100 text-brand-900' : 'bg-white border border-gray-200 text-gray-800'} rounded-lg p-3 text-sm shadow-sm`}>
                                      <p className="mb-1">{msg.content}</p>
                                      <div className="flex items-center gap-2 justify-end opacity-60 text-[10px]">
                                        <span className="capitalize">{msg.channel}</span>
                                        <span>•</span>
                                        <span>{new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {selectedCustomer.messages.length === 0 && (
                                  <p className="text-center text-xs text-gray-400 italic py-4">No communication history.</p>
                                )}
                              </div>

                              <div className="p-3 border-t border-brand-100 bg-white flex-shrink-0">
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="flex-1 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                  />
                                  <button 
                                    onClick={handleSendReply}
                                    disabled={!replyText.trim()}
                                    className="bg-brand-900 text-white p-2 rounded-lg hover:bg-brand-800 transition disabled:opacity-50"
                                  >
                                    <Send size={16} />
                                  </button>
                                </div>
                              </div>
                           </div>
                        </div>

                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-brand-300 p-8 text-center bg-brand-50/30">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                       <UserIcon size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-lg font-serif text-brand-900 mb-2">Select a Customer</h3>
                    <p className="text-sm max-w-xs mx-auto">
                      View comprehensive profiles, AI-driven insights, and detailed history by selecting a customer from the list.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'campaigns' ? (
            <CampaignManager customers={customers} />
          ) : activeTab === 'inventory' ? (
            <InventoryManager products={products} setProducts={setProducts} />
          ) : activeTab === 'offers' ? (
            <OfferManager />
          ) : (
             <OrderManager orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
          )}
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = () => (
  <svg className="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" fill="currentColor"/>
  </svg>
);
