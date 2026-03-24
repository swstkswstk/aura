import React, { useState, useEffect } from 'react';
import { About } from './components/About';
import { Auth } from './components/Auth';
import { CartDrawer } from './components/CartDrawer';
import { CrmDashboard } from './components/CrmDashboard';
import { Journal } from './components/Journal';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { Offers } from './components/Offers';
import { Shop } from './components/Shop';
import { UserProfile } from './components/UserProfile';
import { ViewMode, Product, CartItem, Order, User, Customer } from './types';
import { checkAuth, logout as authLogout } from './services/authService';
import { productsApi, ordersApi, usersApi } from './services/api';
import { INITIAL_CUSTOMERS } from './constants';

const USER_CART_STORAGE_PREFIX = 'aura_user_cart_';

const getUserCartStorageKey = (userId: string) => `${USER_CART_STORAGE_PREFIX}${userId}`;

const parseStoredCartItems = (rawValue: string | null): CartItem[] => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.error('Failed to parse saved cart:', error);
    return [];
  }
};

const readStoredCartItems = (userId: string): CartItem[] => (
  parseStoredCartItems(localStorage.getItem(getUserCartStorageKey(userId)))
);

const mergeCartItems = (baseItems: CartItem[], incomingItems: CartItem[]) => {
  const mergedItems = [...baseItems];

  for (const item of incomingItems) {
    const existingItem = mergedItems.find((currentItem) => (
      currentItem.productId === item.productId &&
      currentItem.variantId === item.variantId
    ));

    if (existingItem) {
      existingItem.quantity += item.quantity;
      continue;
    }

    mergedItems.push({ ...item });
  }

  return mergedItems;
};

const getInitialCartForUser = (nextUser: User, currentCartItems: CartItem[] = []) => {
  const serverCart = Array.isArray(nextUser.savedCart) ? nextUser.savedCart : [];
  const localCart = readStoredCartItems(nextUser.id);
  const persistedCart = serverCart.length > 0 ? serverCart : localCart;
  return mergeCartItems(persistedCart, currentCartItems);
};

const reconcileCartItems = (items: CartItem[], catalog: Product[]) => {
  const resolvedItems: CartItem[] = [];
  const unavailableItems: CartItem[] = [];

  for (const item of items) {
    const matchedProduct = catalog.find((product) => (
      product.id === item.productId || product.name === item.productName
    ));

    if (!matchedProduct) {
      unavailableItems.push(item);
      continue;
    }

    const matchedVariant = matchedProduct.variants.find((variant) => (
      variant.id === item.variantId ||
      (item.sku && variant.sku === item.sku) ||
      variant.name === item.variantName
    )) ?? (matchedProduct.variants.length === 1 ? matchedProduct.variants[0] : undefined);

    if (!matchedVariant) {
      unavailableItems.push(item);
      continue;
    }

    resolvedItems.push({
      ...item,
      productId: matchedProduct.id,
      variantId: matchedVariant.id,
      sku: matchedVariant.sku,
      productName: matchedProduct.name,
      variantName: matchedVariant.name,
      price: matchedVariant.price,
      image: matchedProduct.image,
    });
  }

  return { resolvedItems, unavailableItems };
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [user, setUser] = useState<User | null>(null);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  
  // Loading States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  
  // Error State
  const [error, setError] = useState<string | null>(null);
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshProducts = async (options: { showLoader?: boolean } = {}) => {
    const { showLoader = true } = options;

    if (showLoader) {
      setIsProductsLoading(true);
    }

    try {
      const result = await productsApi.getAll();
      if (result.success && result.products) {
        setProducts(result.products);
        setError(null);
        return result.products;
      }

      setProducts([]);
      setError(result.error || 'Failed to fetch products');
      return [];
    } catch (err) {
      console.error('Products fetch failed:', err);
      setProducts([]);
      setError('Failed to fetch products');
      return [];
    } finally {
      if (showLoader) {
        setIsProductsLoading(false);
      }
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await checkAuth();
        if (result.success && result.user) {
          setUser(result.user);
          setCartItems(getInitialCartForUser(result.user));
          // Navigate based on role
          if (result.user.role === 'admin') {
            setCurrentView('landing'); // Admins start at landing, can navigate to CRM
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    localStorage.setItem(getUserCartStorageKey(user.id), JSON.stringify(cartItems));

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const result = await usersApi.updateProfile({ savedCart: cartItems });
        if (!result.success) {
          console.error('Failed to sync saved cart:', result.error);
        }
      })();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [user?.id, cartItems]);

  // Fetch products on mount
  useEffect(() => {
    void refreshProducts();
  }, []);

  // Fetch user orders when user logs in
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setOrders([]);
        return;
      }

      setIsOrdersLoading(true);
      try {
        const result = await ordersApi.getAll();
        if (result.success && result.orders) {
          setOrders(result.orders);
        }
      } catch (err) {
        console.error('Orders fetch failed:', err);
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCartItems((prev) => getInitialCartForUser(newUser, prev));
    // Navigate based on role
    const nextView = newUser.role === 'admin' ? 'landing' : 'shop';
    setCurrentView(nextView);
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setOrders([]);
    setCartItems([]);
    setCurrentView('landing');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);

    if (updatedUser.id && Array.isArray(updatedUser.savedCart)) {
      setCartItems(updatedUser.savedCart);
    }
  };

  // Cart Handlers
  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId);
      if (existing) {
        return prev.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCartItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const handlePlaceOrder = async (details: { name: string; email: string; phone: string; address: string }) => {
    if (!user) {
      // Redirect to auth if not logged in
      setCurrentView('auth');
      return;
    }

    try {
      const latestCatalog = await refreshProducts({ showLoader: false });
      const catalogToUse = latestCatalog.length > 0 ? latestCatalog : products;
      const { resolvedItems, unavailableItems } = reconcileCartItems(cartItems, catalogToUse);

      if (unavailableItems.length > 0) {
        setCartItems(resolvedItems);
        setError(`Some variants are no longer available. Removed ${unavailableItems.length} item(s) from your cart.`);
        return;
      }

      const result = await ordersApi.create(resolvedItems, details);
      
      if (result.success && result.order) {
        setOrders(prev => [result.order!, ...prev]);
        setCartItems([]);
        setError(null);
        const profileResult = await usersApi.updateProfile({
          name: details.name,
          email: details.email,
          phone: details.phone,
          address: details.address,
          savedCart: [],
        });

        if (profileResult.success && profileResult.user) {
          setUser(profileResult.user);
        }

        await refreshProducts({ showLoader: false });
        return result.order;
      }

      setError(result.error || 'Failed to place order');
      return;
    } catch (err) {
      console.error('Place order failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
      return;
    }
  };

  // Show loading screen while checking auth
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-600 font-medium">Loading Aura...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      cartItemCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
      onOpenCart={() => setIsCartOpen(true)}
      user={user}
      onLogout={handleLogout}
    >
      {currentView === 'landing' && <LandingPage 
        products={products} 
        onAddToCart={handleAddToCart} 
        onNavigate={setCurrentView}
      />}
      
      {currentView === 'shop' && (
        <Shop 
          products={products} 
          onAddToCart={handleAddToCart} 
          isLoading={isProductsLoading}
        />
      )}
      
      {currentView === 'about' && <About />}

      {currentView === 'offers' && <Offers products={products} onAddToCart={handleAddToCart} />}
      
      {currentView === 'journal' && <Journal />}

      {currentView === 'crm' && (
        user?.role === 'admin' ? (
          <CrmDashboard 
            customers={customers} 
            setCustomers={setCustomers}
            products={products} 
            setProducts={setProducts}
            orders={orders} 
            setOrders={setOrders}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-brand-500">
            <h2 className="text-xl font-serif mb-4">Staff Access Only</h2>
            <p className="mb-6">Please log in with an administrator account to view the CRM.</p>
            <button 
              onClick={() => setCurrentView('auth')} 
              className="bg-brand-900 text-white px-6 py-2 rounded-lg"
            >
              Go to Login
            </button>
          </div>
        )
      )}

      {currentView === 'auth' && (
        <Auth onLogin={handleLogin} onCancel={() => setCurrentView('landing')} />
      )}

      {currentView === 'profile' && user && (
        <UserProfile 
          user={user} 
          orders={orders} 
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          isOrdersLoading={isOrdersLoading}
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={handleRemoveFromCart}
        onPlaceOrder={handlePlaceOrder}
        isLoggedIn={!!user}
        onLoginRequired={() => setCurrentView('auth')}
        user={user}
      />
    </Layout>
  );
};

export default App;
