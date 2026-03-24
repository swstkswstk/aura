import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { ordersApi, AdminOrder } from '../services/api';
import { 
  Package, Search, Loader2, RefreshCw, Mail, MapPin, 
  Calendar, User, ChevronDown, ChevronUp, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderManagerProps {
  orders?: Order[];
  onUpdateStatus?: (orderId: string, status: Order['status']) => void;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ orders: propOrders, onUpdateStatus }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const result = await ordersApi.getAllAdmin(statusFilter, searchQuery);
      if (result.success && result.orders) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    setUpdatingOrderId(orderId);
    try {
      const result = await ordersApi.updateStatus(orderId, status);
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        if (onUpdateStatus) {
          onUpdateStatus(orderId, status);
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-brand-100 bg-brand-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-serif font-medium text-brand-900">All Orders</h2>
            <p className="text-sm text-brand-500">
              View and manage orders from all customers • {orders.length} total
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-brand-200 rounded-lg text-sm text-brand-600 hover:bg-brand-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by customer name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {statusOptions.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === status 
                    ? 'bg-brand-900 text-white' 
                    : 'bg-white border border-brand-200 text-brand-600 hover:bg-brand-50'
                }`}
              >
                {status}
                {status !== 'All' && (
                  <span className="ml-1 text-xs opacity-70">
                    ({orders.filter(o => o.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-brand-400">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-brand-300">
            <Package size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== 'All' 
                ? 'Try adjusting your filters' 
                : 'Orders will appear here when customers make purchases'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <motion.div 
                key={order.id} 
                layout
                className="border border-brand-100 rounded-xl overflow-hidden hover:shadow-md transition"
              >
                {/* Order Header */}
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Left: Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-brand-900 text-lg">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      {/* Customer Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-brand-700">
                          <User size={14} className="text-brand-400" />
                          <span className="font-medium">{order.userName || order.customerDetails.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-brand-500">
                          <Mail size={14} className="text-brand-400" />
                          <span>{order.userEmail || order.customerDetails.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-brand-500">
                          <Calendar size={14} className="text-brand-400" />
                          <span>{formatDate(order.date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Total & Actions */}
                    <div className="text-right flex-shrink-0">
                      <span className="block text-2xl font-serif text-brand-900 mb-2">
                        ₹{order.total.toFixed(2)}
                      </span>
                      <span className="text-xs text-brand-400">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                      <div className="mt-3">
                        {expandedOrderId === order.id ? (
                          <ChevronUp size={20} className="text-brand-400 inline" />
                        ) : (
                          <ChevronDown size={20} className="text-brand-400 inline" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-brand-100"
                    >
                      <div className="p-5 bg-brand-50/30">
                        {/* Contact & Shipping Info */}
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-lg border border-brand-100">
                            <div className="flex items-start gap-2">
                              <Phone size={16} className="text-brand-400 mt-0.5" />
                              <div>
                                <span className="text-xs font-bold text-brand-500 uppercase tracking-wide block mb-1">
                                  Phone Number
                                </span>
                                <p className="text-sm text-brand-700">{order.customerDetails.phone || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-brand-100">
                            <div className="flex items-start gap-2">
                              <MapPin size={16} className="text-brand-400 mt-0.5" />
                              <div>
                                <span className="text-xs font-bold text-brand-500 uppercase tracking-wide block mb-1">
                                  Shipping Address
                                </span>
                                <p className="text-sm text-brand-700">{order.customerDetails.address}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-4">
                          <span className="text-xs font-bold text-brand-500 uppercase tracking-wide block mb-2">
                            Order Items
                          </span>
                          <div className="bg-white rounded-lg border border-brand-100 divide-y divide-brand-50">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4 p-3">
                                <div className="w-12 h-12 bg-brand-100 rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.image} 
                                    alt={item.productName} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-brand-900 truncate">
                                    {item.productName}
                                  </p>
                                  <p className="text-xs text-brand-500">{item.variantName}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-medium text-brand-900">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-brand-400">
                                    ₹{item.price} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Update Status */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-brand-100">
                          <span className="text-sm font-medium text-brand-700">Update Status:</span>
                          <div className="flex items-center gap-2">
                            {updatingOrderId === order.id && (
                              <Loader2 size={16} className="animate-spin text-brand-400" />
                            )}
                            <select 
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                              disabled={updatingOrderId === order.id}
                              className="text-sm border border-brand-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-brand-400 outline-none disabled:opacity-50"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
