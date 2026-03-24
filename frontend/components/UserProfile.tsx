
import React, { useState, useRef } from 'react';
import { User, Order } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, Package, Settings, Camera, 
  MapPin, Mail, Phone, LogOut, UploadCloud, CheckCircle, Loader2,
  Sparkles, Plus, X, AlertCircle
} from 'lucide-react';
import { uploadProfileImage } from '../services/storageService';
import { usersApi } from '../services/api';

interface UserProfileProps {
  user: User;
  orders: Order[];
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  isOrdersLoading?: boolean;
}

type Tab = 'overview' | 'orders' | 'settings' | 'scent_profile';

export const UserProfile: React.FC<UserProfileProps> = ({ user, orders, onUpdateUser, onLogout, isOrdersLoading = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  });

  // Preferences State
  const [preferences, setPreferences] = useState<string[]>(user.preferences || []);
  const [newScent, setNewScent] = useState('');

  React.useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setPreferences(user.preferences || []);
  }, [user]);

  React.useEffect(() => {
    if (!profileMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setProfileMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [profileMessage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadProfileImage(file);
    } catch (error) {
      console.error("Upload failed", error);
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload image.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const result = await usersApi.updateProfile({
        name: formData.name,
        email: formData.email.trim() || undefined,
        phone: formData.phone,
        address: formData.address,
        preferences,
      });

      if (!result.success || !result.user) {
        throw new Error(result.error || 'Failed to update profile.');
      }

      onUpdateUser(result.user);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      console.error("Save failed", error);
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddScent = () => {
    if (newScent.trim() && !preferences.includes(newScent.trim())) {
      setPreferences([...preferences, newScent.trim()]);
      setNewScent('');
    }
  };

  const handleRemoveScent = (scent: string) => {
    setPreferences(preferences.filter(p => p !== scent));
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative whitespace-nowrap
        ${activeTab === id ? 'text-brand-900' : 'text-brand-400 hover:text-brand-600'}`}
    >
      <Icon size={18} />
      {label}
      {activeTab === id && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-800"
        />
      )}
    </button>
  );

  const avatarInitials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AU';

  return (
    <div className="min-h-screen bg-brand-50 pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar / Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-brand-900/5"></div>
            
            <div className="relative inline-block mb-4">
               <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-brand-200">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        const nextElement = event.currentTarget.nextElementSibling as HTMLElement | null;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className={`h-full w-full items-center justify-center bg-brand-800 text-2xl font-semibold text-white ${user.avatar ? 'hidden' : 'flex'}`}>
                    {avatarInitials}
                  </div>
               </div>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-brand-800 text-white rounded-full hover:bg-brand-700 transition shadow-sm border-2 border-white"
                 title="Profile image upload is disabled until cloud storage is configured"
               >
                 {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleImageUpload}
               />
            </div>
            
            <h2 className="text-xl font-serif font-medium text-brand-900">{user.name}</h2>
            <p className="text-sm text-brand-500 mb-6">{user.role === 'admin' ? 'Administrator' : 'Aura Collector'}</p>
            
            <div className="space-y-3 text-left">
               {profileMessage && (
                 <div className={`flex items-start gap-3 rounded-lg border px-3 py-3 text-sm ${
                   profileMessage.type === 'success'
                     ? 'border-green-200 bg-green-50 text-green-700'
                     : 'border-red-200 bg-red-50 text-red-700'
                 }`}>
                   <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                   <span>{profileMessage.text}</span>
                 </div>
               )}
               <div className="flex items-center gap-3 text-sm text-brand-600 p-3 bg-brand-50 rounded-lg">
                 <Mail size={16} className="text-brand-400" />
                 <span className="truncate">{user.email || 'No email set'}</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-brand-600 p-3 bg-brand-50 rounded-lg">
                 <MapPin size={16} className="text-brand-400" />
                 <span className="truncate">{user.address || 'No address set'}</span>
               </div>
               {/* Display top 2 preferences in sidebar for quick view */}
               {preferences.length > 0 && (
                 <div className="flex items-center gap-3 text-sm text-brand-600 p-3 bg-brand-50 rounded-lg">
                    <Sparkles size={16} className="text-brand-400" />
                    <span className="truncate">{preferences.slice(0, 2).join(', ')}{preferences.length > 2 ? '...' : ''}</span>
                 </div>
               )}
            </div>

            <button 
               onClick={onLogout}
               className="w-full mt-8 flex items-center justify-center gap-2 text-brand-400 hover:text-red-600 text-sm font-medium transition"
            >
               <LogOut size={16} /> Sign Out
            </button>
          </div>

          <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-6 text-white shadow-lg">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-white/10 rounded-full"><UploadCloud size={20}/></div>
               <span className="font-medium">Cloud Sync Active</span>
             </div>
             <p className="text-brand-200 text-sm leading-relaxed">
               Your profile and order history are stored through the Aura backend. Add real object storage before enabling persistent avatar uploads.
             </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
           <div className="bg-white rounded-2xl shadow-sm border border-brand-100 min-h-[600px] flex flex-col">
              <div className="flex border-b border-brand-100 px-2 overflow-x-auto scrollbar-hide">
                 <TabButton id="overview" icon={UserIcon} label="Overview" />
                 <TabButton id="orders" icon={Package} label="Order History" />
                 <TabButton id="scent_profile" icon={Sparkles} label="Scent Profile" />
                 <TabButton id="settings" icon={Settings} label="Settings" />
              </div>

              <div className="p-8 flex-1">
                 <AnimatePresence mode="wait">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                       <motion.div 
                         key="overview"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="space-y-8"
                       >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-brand-50 p-6 rounded-xl border border-brand-100">
                                <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4">Total Orders</h3>
                                <p className="text-4xl font-serif text-brand-900">{orders.length}</p>
                             </div>
                             <div className="bg-brand-50 p-6 rounded-xl border border-brand-100">
                                <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4">Member Since</h3>
                                <p className="text-lg font-medium text-brand-900">{new Date().getFullYear()}</p>
                             </div>
                          </div>

                          <div>
                             <h3 className="text-lg font-serif text-brand-900 mb-4">Recent Activity</h3>
                             {orders.length > 0 ? (
                                <div className="border border-brand-100 rounded-xl overflow-hidden">
                                   {orders.slice(0, 3).map((order) => (
                                     <div key={order.id} className="p-4 border-b border-brand-50 last:border-0 flex justify-between items-center hover:bg-brand-50/50 transition">
                                        <div>
                                           <div className="font-medium text-brand-900">Order #{order.id.slice(-6).toUpperCase()}</div>
                                           <div className="text-xs text-brand-500">{new Date(order.date).toLocaleDateString()}</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                           {order.status}
                                        </div>
                                     </div>
                                   ))}
                                </div>
                             ) : (
                                <p className="text-brand-400 text-sm italic">No recent activity found.</p>
                             )}
                          </div>
                       </motion.div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && (
                       <motion.div 
                         key="orders"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="space-y-6"
                       >
                         <h3 className="text-lg font-serif text-brand-900">Your Collection History</h3>
                         
                         {isOrdersLoading ? (
                            <div className="text-center py-12">
                               <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
                               <p className="text-brand-400">Loading orders...</p>
                            </div>
                         ) : orders.length === 0 ? (
                            <div className="text-center py-12 text-brand-300">
                               <Package size={48} className="mx-auto mb-4 opacity-50"/>
                               <p>You haven't placed any orders yet.</p>
                            </div>
                         ) : (
                            <div className="space-y-4">
                               {orders.map(order => (
                                  <div key={order.id} className="border border-brand-100 rounded-xl p-6 hover:shadow-md transition">
                                     <div className="flex flex-wrap justify-between items-start gap-4 mb-4 border-b border-brand-50 pb-4">
                                        <div>
                                           <span className="text-xs text-brand-400 uppercase tracking-wider block">Order ID</span>
                                           <span className="font-medium text-brand-900">#{order.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <div>
                                           <span className="text-xs text-brand-400 uppercase tracking-wider block">Date</span>
                                           <span className="text-sm text-brand-600">{new Date(order.date).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                           <span className="text-xs text-brand-400 uppercase tracking-wider block">Total</span>
                                           <span className="font-serif text-lg text-brand-900">₹{order.total}</span>
                                        </div>
                                        <div className="flex items-center">
                                           <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                             {order.status}
                                           </span>
                                        </div>
                                     </div>
                                     <div className="space-y-3">
                                        {order.items.map((item, idx) => (
                                           <div key={idx} className="flex gap-4 items-center">
                                              <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                 <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                              </div>
                                              <div className="flex-1">
                                                 <p className="text-sm font-medium text-brand-900">{item.productName}</p>
                                                 <p className="text-xs text-brand-500">{item.variantName} • Qty: {item.quantity}</p>
                                              </div>
                                              <div className="text-sm font-medium text-brand-900">
                                                 ₹{item.price * item.quantity}
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               ))}
                            </div>
                         )}
                       </motion.div>
                    )}

                    {/* SCENT PROFILE TAB */}
                    {activeTab === 'scent_profile' && (
                       <motion.div 
                         key="scent_profile"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="max-w-xl"
                       >
                          <h3 className="text-lg font-serif text-brand-900 mb-6">Favorite Scents</h3>
                          <p className="text-sm text-brand-500 mb-6 leading-relaxed">
                              Curate your olfactory palette. Adding your favorite notes (e.g., Oud, Rose, Citrus) helps Aura highlight fragrances that fit your style more precisely.
                          </p>

                          <div className="space-y-8">
                              <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-100">
                                  <label className="block text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Add a Scent Note</label>
                                  <div className="flex gap-2">
                                      <input 
                                          value={newScent}
                                          onChange={(e) => setNewScent(e.target.value)}
                                          onKeyDown={(e) => e.key === 'Enter' && handleAddScent()}
                                          placeholder="e.g. Bergamot, Sandalwood..."
                                          className="flex-1 bg-white border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                                      />
                                      <button 
                                          onClick={handleAddScent}
                                          disabled={!newScent.trim()}
                                          className="bg-brand-800 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-50 shadow-sm"
                                      >
                                          <Plus size={20} />
                                      </button>
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Your Palette</label>
                                  <div className="min-h-[120px]">
                                      {preferences.length > 0 ? (
                                          <div className="flex flex-wrap gap-3">
                                              {preferences.map(scent => (
                                                  <span key={scent} className="inline-flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-white border border-brand-200 text-brand-800 text-sm shadow-sm hover:shadow-md transition-shadow group">
                                                      {scent}
                                                      <button 
                                                          onClick={() => handleRemoveScent(scent)}
                                                          className="p-1 rounded-full text-brand-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                      >
                                                          <X size={14} />
                                                      </button>
                                                  </span>
                                              ))}
                                          </div>
                                      ) : (
                                          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-brand-100 rounded-xl text-brand-300">
                                              <Sparkles size={24} className="mb-2 opacity-50" />
                                              <p className="text-sm italic">No favorite scents added yet.</p>
                                          </div>
                                      )}
                                  </div>
                              </div>
                              
                              <div className="pt-6 border-t border-brand-100 flex justify-end">
                                <button 
                                   onClick={handleSaveProfile}
                                   disabled={isSaving}
                                   className="flex items-center gap-2 bg-brand-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-800 transition shadow-lg shadow-brand-900/10 disabled:opacity-70"
                                >
                                   {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                   Save Preferences
                                </button>
                             </div>
                          </div>
                       </motion.div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                       <motion.div 
                         key="settings"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="max-w-xl"
                       >
                          <h3 className="text-lg font-serif text-brand-900 mb-6">Personal Details</h3>
                          <div className="space-y-5">
                             <div>
                                <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Full Name</label>
                                <input 
                                   value={formData.name}
                                   onChange={e => setFormData({...formData, name: e.target.value})}
                                   className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                                />
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                   <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Email</label>
                                   <div className="relative">
                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                                      <input 
                                         value={formData.email}
                                         onChange={e => setFormData({...formData, email: e.target.value})}
                                         className="w-full pl-9 pr-4 py-3 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                                      />
                                   </div>
                                </div>
                                <div>
                                   <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Phone</label>
                                   <div className="relative">
                                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                                      <input 
                                         value={formData.phone}
                                         onChange={e => setFormData({...formData, phone: e.target.value})}
                                         className="w-full pl-9 pr-4 py-3 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                                      />
                                   </div>
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Shipping Address</label>
                                <textarea 
                                   value={formData.address}
                                   onChange={e => setFormData({...formData, address: e.target.value})}
                                   rows={3}
                                   className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                                   placeholder="Street, City, Zip Code, Country"
                                />
                             </div>
                             
                             <div className="pt-6 border-t border-brand-100 flex justify-end">
                                <button 
                                   onClick={handleSaveProfile}
                                   disabled={isSaving}
                                   className="flex items-center gap-2 bg-brand-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-800 transition shadow-lg shadow-brand-900/10 disabled:opacity-70"
                                >
                                   {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                   Save Changes
                                </button>
                             </div>
                          </div>
                       </motion.div>
                    )}

                 </AnimatePresence>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
