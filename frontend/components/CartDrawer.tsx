import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ArrowRight, ShoppingBag, CheckCircle, Phone, Mail, User, MapPin } from 'lucide-react';
import { CartItem, Order, User as UserType } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (variantId: string) => void;
  onPlaceOrder: (details: { name: string; email: string; phone: string; address: string }) => Promise<Order | void>;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  user?: UserType | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, onClose, items, onRemove, onPlaceOrder, isLoggedIn = true, onLoginRequired, user 
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form data from user profile when checkout starts
  useEffect(() => {
    if (step === 'checkout' && user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || '',
      }));
    }
  }, [step, user]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s+\-()]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP/Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Combine address fields into single string
    const fullAddress = [
      formData.address,
      formData.city,
      formData.state,
      formData.zipCode,
      formData.country
    ].filter(Boolean).join(', ');

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const order = await onPlaceOrder({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: fullAddress
      });

      if (order) {
        setStep('success');
        return;
      }

      setSubmitError('Unable to place your order. Please review your cart and try again.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to place your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after transition
    setTimeout(() => {
      setStep('cart');
      setErrors({});
      setSubmitError('');
      setIsSubmitting(false);
    }, 500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[71] flex flex-col"
          >
            <div className="p-6 border-b border-brand-100 flex items-center justify-between bg-brand-50">
              <h2 className="font-serif text-xl text-brand-900">
                {step === 'cart' ? 'Your Selection' : step === 'checkout' ? 'Checkout' : 'Order Confirmed'}
              </h2>
              <button onClick={handleClose} className="p-2 hover:bg-brand-200 rounded-full transition">
                <X size={20} className="text-brand-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {step === 'cart' && (
                <>
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-brand-400">
                      <ShoppingBag size={48} className="mb-4 opacity-50" />
                      <p>Your cart is empty.</p>
                      <button onClick={handleClose} className="mt-4 text-brand-800 font-medium underline">Start Shopping</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                          <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-serif text-brand-900">{item.productName}</h3>
                                <p className="text-xs text-brand-500">{item.variantName}</p>
                              </div>
                              <button 
                                onClick={() => onRemove(item.variantId)}
                                className="text-brand-300 hover:text-red-500 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                               <span className="text-xs text-brand-400">Qty: {item.quantity}</span>
                               <span className="font-medium text-brand-900">₹{item.price * item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 'checkout' && (
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wide mb-4">Contact Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                          <input 
                            type="text" 
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.name ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                          <input 
                            type="email" 
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.email ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                          <input 
                            type="tel" 
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={e => handleInputChange('phone', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.phone ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wide mb-4">Shipping Address</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Street Address *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-brand-400 w-4 h-4" />
                          <textarea 
                            rows={2}
                            placeholder="House/Flat No., Street, Landmark"
                            value={formData.address}
                            onChange={e => handleInputChange('address', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none resize-none ${
                              errors.address ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            City *
                          </label>
                          <input 
                            type="text" 
                            placeholder="City"
                            value={formData.city}
                            onChange={e => handleInputChange('city', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.city ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            State/Province
                          </label>
                          <input 
                            type="text" 
                            placeholder="State"
                            value={formData.state}
                            onChange={e => handleInputChange('state', e.target.value)}
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            ZIP/Postal Code *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ZIP Code"
                            value={formData.zipCode}
                            onChange={e => handleInputChange('zipCode', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.zipCode ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                          {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            Country
                          </label>
                          <input 
                            type="text" 
                            placeholder="Country"
                            value={formData.country}
                            onChange={e => handleInputChange('country', e.target.value)}
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="bg-brand-50 p-4 rounded-lg">
                    <h4 className="font-serif text-brand-900 mb-3">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-brand-600">
                          <span>{item.quantity}x {item.productName}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-brand-200 mt-3 pt-3 space-y-1">
                      <div className="flex justify-between text-sm text-brand-600">
                        <span>Subtotal</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-brand-600">
                        <span>Shipping</span>
                        <span>Free</span>
                      </div>
                      <div className="flex justify-between font-bold text-brand-900 pt-2 border-t border-brand-200">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}
                </form>
              )}

              {step === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="font-serif text-2xl text-brand-900 mb-2">Order Placed!</h3>
                  <p className="text-brand-500 mb-4">
                    Thank you, {formData.name.split(' ')[0]}!
                  </p>
                  <p className="text-brand-400 text-sm mb-8 max-w-xs">
                    We'll send a confirmation to <span className="font-medium text-brand-600">{formData.email}</span> and notify you at <span className="font-medium text-brand-600">{formData.phone}</span> when your order ships.
                  </p>
                  <button 
                    onClick={handleClose}
                    className="bg-brand-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-800 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>

            {step !== 'success' && items.length > 0 && (
              <div className="p-6 border-t border-brand-100 bg-white">
                {step === 'cart' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-brand-500">Total</span>
                      <span className="text-2xl font-serif text-brand-900">₹{total.toFixed(2)}</span>
                    </div>
                    {!isLoggedIn ? (
                      <button 
                        onClick={() => {
                          onClose();
                          onLoginRequired?.();
                        }}
                        className="w-full bg-brand-900 text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-brand-800 transition"
                      >
                        Sign in to Checkout <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setStep('checkout')}
                        className="w-full bg-brand-900 text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-brand-800 transition"
                      >
                        Checkout <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep('cart')}
                      className="flex-1 px-4 py-3 border border-brand-200 rounded-lg text-brand-600 font-medium hover:bg-brand-50 transition"
                    >
                      Back
                    </button>
                    <button 
                      form="checkout-form"
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] bg-brand-900 text-white py-3 rounded-lg font-medium hover:bg-brand-800 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
