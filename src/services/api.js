// Base URL for your API - adjust if your Django backend runs on a different port
const API_BASE_URL = 'http://localhost:8000';

// Helper function for handling fetch responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to parse error as JSON, but fall back to text if it fails
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    } else {
      const text = await response.text();
      throw new Error(`Status ${response.status}: ${text.substring(0, 100)}...`);
    }
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return { success: true };
};

// Product-related API calls
export const productService = {
  // Get products with pagination and filtering
  getProducts: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    console.log('Fetching products with filters:', Object.fromEntries(queryParams));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/?${queryParams.toString()}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Products API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get a single product by slug
  getProduct: async (slug) => {
    return fetch(`${API_BASE_URL}/api/products/${slug}/`, {
      method: 'GET'
    }).then(handleResponse);
  },

  // Get featured products
  getFeaturedProducts: async () => {
    console.log('Fetching featured products');
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/featured/`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Featured products response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  },

  // Get new arrivals
  getNewArrivals: async () => {
    console.log('Fetching new arrivals');
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/new_arrivals/`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('New arrivals response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      throw error;
    }
  },

  // Get top sellers
  getTopSellers: async () => {
    console.log('Fetching top sellers');
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/top_sellers/`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Top sellers response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching top sellers:', error);
      throw error;
    }
  },

  // Search products with pagination
  searchProducts: async (query, page = 1, filters = {}) => {
    const queryParams = new URLSearchParams({ 
      page, 
      search: query,
      ...filters 
    });
    return fetch(`${API_BASE_URL}/api/products/?${queryParams.toString()}`, {
      method: 'GET'
    }).then(handleResponse);
  },

  // Get products by category with pagination
  getProductsByCategory: async (categoryName, page = 1, filters = {}) => {
    const queryParams = new URLSearchParams({ 
      page,
      category__name: categoryName,
      ...filters 
    });
    return fetch(`${API_BASE_URL}/api/products/?${queryParams.toString()}`, {
      method: 'GET'
    }).then(handleResponse);
  },

  // Get product details by slug
  getProductDetails: async (slug) => {
    return fetch(`${API_BASE_URL}/api/products/${slug}/`, {
      method: 'GET'
    }).then(handleResponse);
  },

  // Get all categories
  getCategories: async () => {
    console.log('Fetching categories from:', `${API_BASE_URL}/api/categories/`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Categories API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get all brands
  getBrands: async () => {
    console.log('Fetching brands from:', `${API_BASE_URL}/api/brands/`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/brands/`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Brands API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }
};

// User-related API calls
export const userService = {
  // Get user profile
  getProfile: async () => {
    return fetch(`${API_BASE_URL}/get-profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    }).then(handleResponse);
  },

  // Update user profile
  updateProfile: async (userData) => {
    // If userData is FormData, don't set Content-Type (browser will set it with boundary)
    const isFormData = userData instanceof FormData;

    return fetch(`${API_BASE_URL}/api/update-profile/`, {
      method: 'POST',
      headers: isFormData ? {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      } : {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: isFormData ? userData : JSON.stringify(userData)
    }).then(handleResponse);
  }
};

// Order-related API calls
export const orderService = {
  // Get all orders
  getOrders: () => {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    return Promise.resolve(orders);
  },

  // Add new order
  addOrder: (orderData) => {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const newOrder = {
      ...orderData,
      orderId: `ORD-${Date.now()}`,
      orderDate: new Date().toISOString(),
      status: orderData.status || 'To Ship',
      subStatus: orderData.subStatus || 'Processing',
      paymentDetails: {
        method: orderData.paymentMethod,
        status: 'Paid',
        total: orderData.total
      },
      deliveryDetails: {
        method: orderData.deliveryMethod,
        address: orderData.shippingAddress,
        billing: orderData.billingAddress
      },
      products: orderData.items.map(item => ({
        ...item,
        total: (item.price * item.quantity).toFixed(2)
      }))
    };

    orders.unshift(newOrder); // Add to start of array
    localStorage.setItem('orders', JSON.stringify(orders));
    return Promise.resolve(newOrder);
  },

  // Update order status
  updateOrderStatus: (orderId, newStatus, reason) => {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.map(order => {
      if (order.orderId === orderId) {
        return {
          ...order,
          status: newStatus,
          subStatus: newStatus === 'Completed' ? 'Order Completed'
                    : newStatus === 'Cancelled' ? 'Cancelled by you'
                    : order.subStatus,
          cancelReason: newStatus === 'Cancelled' ? reason : order.cancelReason,
          updatedAt: new Date().toISOString()
        };
      }
      return order;
    });
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    return Promise.resolve(updatedOrders);
  },

  // Get single order
  getOrder: (orderId) => {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderId === orderId);
    return Promise.resolve(order || null);
  }
};

// Cart-related API calls
export const cartService = {
  // Implementation will come in future steps
};