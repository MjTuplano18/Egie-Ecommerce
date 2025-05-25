const BASE_URL = 'http://localhost:8000/api';

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    const csrfToken = getCookie('csrftoken');
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Always include CSRF token if available
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }
    
    // Include auth token if available 
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

const ensureCsrfToken = async () => {
    if (!getCookie('csrftoken')) {
        console.log('Fetching new CSRF token...');
        try {
            const response = await fetch(`${BASE_URL}/get-csrf-token/`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('Failed to fetch CSRF token:', response.status);
                throw new Error('Failed to fetch CSRF token');
            }

            const csrfToken = getCookie('csrftoken');
            if (!csrfToken) {
                console.error('CSRF token not set after fetch');
                throw new Error('CSRF token not set');
            }
            console.log('CSRF token fetched successfully');
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            throw error;
        }
    }
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || 'Something went wrong');
        } else {
            const text = await response.text();
            throw new Error(`Server error: ${response.status} - ${text.substring(0, 100)}`);
        }
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return { success: true };
};

export const cartService = {
    getCart: async () => {
        await ensureCsrfToken();
        try {
            const response = await fetch(`${BASE_URL}/cart/`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error getting cart:', error);
            throw error;
        }
    },

    addToCart: async (productId, quantity = 1, variationId = null) => {
        await ensureCsrfToken();
        try {
            const requestData = {
                product_id: productId,
                quantity: quantity
            };
            if (variationId) {
                requestData.variation_id = variationId;
            }

            const response = await fetch(`${BASE_URL}/cart/add/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(requestData)
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    },

    updateCartItem: async (itemId, quantity) => {
        await ensureCsrfToken();
        try {
            const response = await fetch(`${BASE_URL}/cart/update/${itemId}/`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ quantity })
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error updating cart item:', error);
            throw error;
        }
    },

    removeFromCart: async (itemId) => {
        await ensureCsrfToken();
        try {
            const response = await fetch(`${BASE_URL}/cart/remove/${itemId}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    },

    clearCart: async () => {
        await ensureCsrfToken();
        try {
            const response = await fetch(`${BASE_URL}/cart/clear/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    }
};
