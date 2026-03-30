import { User, Product, Order, CartItem, AdminOrder, Offer, Customer } from '../types';

// API base URL - will be set from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Token management
const TOKEN_KEY = 'aura_auth_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Helper for authenticated requests
const authFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 errors (token expired)
  if (response.status === 401) {
    removeToken();
    // Optionally trigger a re-login flow
  }

  return response;
};

// Auth API
export const authApi = {
  async sendOtp(phone: string): Promise<{ 
    success: boolean; 
    message?: string; 
    demoCode?: string; 
    error?: string 
  }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }

      return { 
        success: true, 
        message: data.message,
        demoCode: data.demoCode // Only available in development
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async verifyOtp(phone: string, code: string): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      // Store token
      if (data.token) {
        setToken(data.token);
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const token = getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await authFetch('/api/auth/me');
      const data = await response.json();

      if (!response.ok) {
        removeToken();
        return { success: false, error: data.error || 'Failed to get user' };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Get current user error:', error);
      removeToken();
      return { success: false, error: 'Network error' };
    }
  },

  logout(): void {
    removeToken();
  },
};

// Products API
export const productsApi = {
  async getAll(category?: string, search?: string): Promise<{
    success: boolean;
    products?: Product[];
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;

      const response = await authFetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch products' };
      }

      return { success: true, products: data.products };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async getById(id: string): Promise<{
    success: boolean;
    product?: Product;
    error?: string;
  }> {
    try {
      const response = await authFetch(`/api/products/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Product not found' };
      }

      return { success: true, product: data.product };
    } catch (error) {
      console.error('Get product error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async bulkImport(file: File): Promise<{ success: boolean; report?: { created: number; updated: number; errors: string[] }; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/products/bulk`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to import products' };
      }

      return { success: true, report: data.report };
    } catch (error) {
      console.error('Bulk import error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async create(product: Product): Promise<{
    success: boolean;
    product?: Product;
    error?: string;
  }> {
    try {
      const response = await authFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create product' };
      }

      return { success: true, product: data.product };
    } catch (error) {
      console.error('Create product error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async update(id: string, product: Product): Promise<{
    success: boolean;
    product?: Product;
    error?: string;
  }> {
    try {
      const response = await authFetch(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update product' };
      }

      return { success: true, product: data.product };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async remove(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await authFetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to delete product' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: 'Network error' };
    }
  },
};



// Orders API
export const ordersApi = {
  async getAll(): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
    try {
      const response = await authFetch('/api/orders');
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch orders' };
      }

      // Convert date strings to Date objects
      const orders = data.orders.map((order: Order) => ({
        ...order,
        date: new Date(order.date),
      }));

      return { success: true, orders };
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  // Admin: Get all orders from all users
  async getAllAdmin(status?: string, search?: string): Promise<{ 
    success: boolean; 
    orders?: AdminOrder[]; 
    error?: string 
  }> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'All') params.append('status', status);
      if (search) params.append('search', search);

      const queryString = params.toString();
      const url = `/api/orders/admin/all${queryString ? `?${queryString}` : ''}`;

      const response = await authFetch(url);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch orders' };
      }

      // Convert date strings to Date objects
      const orders = data.orders.map((order: AdminOrder) => ({
        ...order,
        date: new Date(order.date),
      }));

      return { success: true, orders };
    } catch (error) {
      console.error('Get admin orders error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  // Admin: Update order status
  async updateStatus(orderId: string, status: Order['status']): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update order status error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async create(
    items: CartItem[],
    customerDetails: { name: string; email: string; phone: string; address: string }
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      const response = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items, customerDetails }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create order' };
      }

      return { 
        success: true, 
        order: {
          ...data.order,
          date: new Date(data.order.date),
        }
      };
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async getById(id: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      const response = await authFetch(`/api/orders/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Order not found' };
      }

      return { 
        success: true, 
        order: {
          ...data.order,
          date: new Date(data.order.date),
        }
      };
    } catch (error) {
      console.error('Get order error:', error);
      return { success: false, error: 'Network error' };
    }
  },
};

// Offers API
export const offersApi = {
  async seedOffers(file: File): Promise<{ success: boolean; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/offers/seed`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to seed offers' };
      }

      return { success: true };
    } catch (error) {
      console.error('Seed offers error:', error);
      return { success: false, error: 'Network error' };
    }
  },
};

// Users API
export const usersApi = {
  async getAdminCustomers(): Promise<{ success: boolean; customers?: Customer[]; error?: string }> {
    try {
      const response = await authFetch('/api/users/admin/customers');
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch customers' };
      }

      const customers = data.customers.map((customer: Customer) => ({
        ...customer,
        lastInteraction: new Date(customer.lastInteraction),
        orders: customer.orders?.map((order: Order) => ({
          ...order,
          date: new Date(order.date),
        })),
        messages: customer.messages?.map((message) => ({
          ...message,
          timestamp: new Date(message.timestamp),
        })) || [],
      }));

      return { success: true, customers };
    } catch (error) {
      console.error('Get admin customers error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async downloadAdminUsersCsv(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await authFetch('/api/users/admin/export');

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to export users' };
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const disposition = response.headers.get('content-disposition');
      const filenameMatch = disposition?.match(/filename=\"?([^"]+)\"?/i);

      link.href = downloadUrl;
      link.download = filenameMatch?.[1] || 'aura-users.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };
    } catch (error) {
      console.error('Download users CSV error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async updateProfile(data: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    address?: string | {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    preferences?: string[] | {
      notes: string[];
      categories: string[];
    };
    savedCart?: CartItem[];
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await authFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to update profile' };
      }

      return { success: true, user: result.user };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await authFetch('/api/users/profile');
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to get profile' };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: 'Network error' };
    }
  },
};
