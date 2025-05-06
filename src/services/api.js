// Base URL for your API - adjust if your Django backend runs on a different port
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function for handling fetch responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
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

// Cart-related API calls (we'll implement these later)
export const cartService = {
  // Implementation will come in future steps
};
