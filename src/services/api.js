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

// Get CSRF token from cookies
const getCSRFToken = () => {
  const name = 'csrftoken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return '';
};

// Function to get auth headers
const getAuthHeaders = (includeContentType = true) => {
  const headers = {};

  // Try different auth token formats
  const accessToken = localStorage.getItem('accessToken');
  const authToken = localStorage.getItem('authToken');
  const token = accessToken || authToken;

  console.log('Auth tokens available:', { accessToken, authToken });

  if (token) {
    // Add both formats of Authorization header to support different backend expectations
    if (token.startsWith('Bearer ')) {
      headers['Authorization'] = token;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('Using Authorization header:', headers['Authorization']);
  } else {
    console.warn('No authentication token found in localStorage');
  }

  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
    console.log('Using CSRF token:', csrfToken);
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// Product-related API calls
export const productService = {
  // Get all products with optional filtering
  getProducts: async (filters = {}) => {
    // Convert filters object to URL query parameters
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetch(`${API_BASE_URL}/products/${queryString}`)
      .then(handleResponse);
  },

  // Get a single product by ID
  getProductById: async (id) => {
    return fetch(`${API_BASE_URL}/products/${id}/`)
      .then(handleResponse);
  }
};

// User-related API calls
export const userService = {
  // Get user profile
  getProfile: async () => {
    return fetch(`${API_BASE_URL}/get-profile/`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    }).then(handleResponse);
  },

  // Update user profile
  updateProfile: async (userData) => {
    // If userData is FormData, don't set Content-Type (browser will set it with boundary)
    const isFormData = userData instanceof FormData;

    return fetch(`${API_BASE_URL}/api/update-profile/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(!isFormData),
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: isFormData ? userData : JSON.stringify(userData),
      credentials: 'include'
    }).then(handleResponse);
  },

  // Get user address
  getAddress: async () => {
    return fetch(`${API_BASE_URL}/get-address/`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    }).then(handleResponse);
  },

  // Update or create user address
  updateAddress: async (addressData) => {
    return fetch(`${API_BASE_URL}/update-address/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData),
      credentials: 'include'
    }).then(handleResponse);
  },

  // Update user password
  updatePassword: async (passwordData) => {
    return fetch(`${API_BASE_URL}/api/change-password/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData),
      credentials: 'include'
    }).then(handleResponse);
  },

  // Upload profile picture
  uploadProfilePicture: async (formData) => {
    return fetch(`${API_BASE_URL}/api/update-profile/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: formData,
      credentials: 'include'
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