const API_BASE_URL = 'http://localhost:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    } else {
      const text = await response.text();
      throw new Error(`Status ${response.status}: ${text.substring(0, 100)}...`);
    }
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return { success: true };
};

const getAuthHeaders = (includeContentType = true) => {
  const headers = {};
  const accessToken = localStorage.getItem('accessToken');
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

export const orderService = {
  // Get order history
  getOrders: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get single order details
  getOrderDetails: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, reason = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/update-status/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status, reason })
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-order/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  // Cancel order
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }
};
