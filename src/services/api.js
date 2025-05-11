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

// User-related API calls
export const userService = {
  // Update user profile
  updateProfile: async (userId, userData) => {
    return fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(userData)
    }).then(handleResponse);
  },
  
  // Update user password
  updatePassword: async (userId, passwordData) => {
    return fetch(`${API_BASE_URL}/users/${userId}/change-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(passwordData)
    }).then(handleResponse);
  },
  
  // Upload profile picture
  uploadProfilePicture: async (userId, formData) => {
    return fetch(`${API_BASE_URL}/users/${userId}/upload-profile-picture/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    }).then(handleResponse);
  }
};

// Cart-related API calls
export const cartService = {
  // Implementation will come in future steps
};