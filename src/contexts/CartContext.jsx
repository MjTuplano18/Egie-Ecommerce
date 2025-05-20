import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      setIsAuthenticated(!!token);
    };

    checkAuth();
    window.addEventListener('auth-change', checkAuth);

    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  // Fetch cart from API when authenticated
  useEffect(() => {
    const fetchCart = async () => {
      console.log("Fetching cart, isAuthenticated:", isAuthenticated);

      if (!isAuthenticated) {
        // If not authenticated, try to load from localStorage
        const savedCart = localStorage.getItem('cart');
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];
        console.log("Loading cart from localStorage:", parsedCart);
        setCartItems(parsedCart);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');

        if (!token) {
          console.log("No access token found, clearing cart");
          setCartItems([]);
          setLoading(false);
          return;
        }

        console.log("Fetching cart from API");
        const response = await axios.get('/api/orders/cart/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log("Cart API response:", response.data);

        if (response.data && response.data.items) {
          // Transform API response to match our cart item structure
          const items = response.data.items.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            selected: true,
            cart_item_id: item.id // Store the cart item ID for API operations
          }));

          console.log("Transformed cart items:", items);
          setCartItems(items);

          // Dispatch an event to notify other components that the cart has changed
          window.dispatchEvent(new Event('cart-updated'));
        } else {
          console.log("No items in cart response, setting empty cart");
          setCartItems([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to load cart');
        setLoading(false);

        // Fallback to localStorage if API fails
        const savedCart = localStorage.getItem('cart');
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];
        console.log("API failed, loading cart from localStorage:", parsedCart);
        setCartItems(parsedCart);
      }
    };

    fetchCart();

    // Also set up an interval to refresh the cart periodically
    const intervalId = setInterval(fetchCart, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  // Save cart to localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const fetchProductDetails = async (productId) => {
    try {
      console.log(`Fetching product details for ID: ${productId}`);
      const response = await fetch(`/api/products/${productId}/`);

      if (!response.ok) {
        console.error(`Failed to fetch product: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      console.log('Product details fetched successfully:', data);

      // Get the main image from the product data
      let imageUrl = null;
      if (data.images && data.images.length > 0) {
        // Try to find a feature image first
        const featureImage = data.images.find(img => img.is_feature);
        if (featureImage) {
          imageUrl = featureImage.image_url;
        } else {
          // Otherwise use the first image
          imageUrl = data.images[0].image_url;
        }
      }

      console.log('Image URL for product:', imageUrl);

      return {
        id: data.id,
        name: data.name,
        price: parseFloat(data.selling_price || data.price),
        image: imageUrl,
        available_stock: data.stock
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  const addToCart = async (product) => {
    console.log("Adding product to cart:", product);

    // Make sure product has an id
    if (!product || !product.id) {
      console.error("Cannot add product without id to cart");
      return;
    }

    try {
      const productDetails = await fetchProductDetails(product.id);
      console.log("Fetched product details:", productDetails);

      if (!productDetails) {
        console.error("Failed to fetch product details");
        return;
      }

      if (productDetails.available_stock < (product.quantity || 1)) {
        alert(`Only ${productDetails.available_stock} items available in stock`);
        return;
      }

      // Ensure all required properties exist
      const newProduct = {
        id: productDetails.id,
        name: productDetails.name || "Unknown Product",
        price: parseFloat(productDetails.price) || 0,
        image: productDetails.image || "https://via.placeholder.com/60",
        quantity: product.quantity || 1,
        selected: true
      };

      console.log("Prepared product for cart:", newProduct);

      // Force a state update to trigger UI refresh
      setLoading(true);

    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('Sending API request to add to cart:', {
          product_id: product.id,
          quantity: product.quantity || 1
        });

        const addResponse = await axios.post('/api/orders/cart/add/', {
          product_id: product.id,
          quantity: product.quantity || 1
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Add to cart API response:', addResponse.data);

        // Refresh cart after adding item
        const cartResponse = await axios.get('/api/orders/cart/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Cart refresh API response:', cartResponse.data);

        if (cartResponse.data && cartResponse.data.items) {
          const items = cartResponse.data.items.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            selected: true,
            cart_item_id: item.id
          }));

          console.log('Setting cart items from API:', items);
          setCartItems(items);

          // Dispatch an event to notify other components that the cart has changed
          window.dispatchEvent(new Event('cart-updated'));
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // For non-authenticated users, use local state
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        if (existingItem) {
          console.log("Updating existing item in cart");
          const updatedItems = prevItems.map(item =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + (product.quantity || 1), productDetails.available_stock)
                }
              : item
          );
          console.log("Updated cart items:", updatedItems);

          // Dispatch an event to notify other components that the cart has changed
          setTimeout(() => window.dispatchEvent(new Event('cart-updated')), 0);

          return updatedItems;
        }
        console.log("Adding new item to cart");
        const newItems = [...prevItems, newProduct];
        console.log("New cart items:", newItems);

        // Dispatch an event to notify other components that the cart has changed
        setTimeout(() => window.dispatchEvent(new Event('cart-updated')), 0);

        return newItems;
      });
      setLoading(false);
    }
  } catch (error) {
    console.error('Error in addToCart:', error);
    setLoading(false);
  }
  };

  const addManyToCart = (products) => {
    setCartItems(prevItems => {
      const newItems = [...prevItems];
      products.forEach(product => {
        const existingItemIndex = newItems.findIndex(item => item.id === product.id);
        if (existingItemIndex >= 0) {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + (product.quantity || 1)
          };
        } else {
          newItems.push({ ...product, quantity: product.quantity || 1, selected: true });
        }
      });
      return newItems;
    });
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('accessToken');
        const item = cartItems.find(item => item.id === productId);

        if (item && item.cart_item_id) {
          await axios.delete(`/api/orders/cart/remove/${item.cart_item_id}/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          // Refresh cart after removing item
          const cartResponse = await axios.get('/api/orders/cart/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (cartResponse.data && cartResponse.data.items) {
            const items = cartResponse.data.items.map(item => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              image: item.image,
              quantity: item.quantity,
              selected: true,
              cart_item_id: item.id
            }));

            setCartItems(items);
          } else {
            setCartItems([]);
          }
        }
      } catch (error) {
        console.error('Error removing from cart:', error);
        alert('Failed to remove item from cart. Please try again.');
      }
    } else {
      // For non-authenticated users, use local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.delete('/api/orders/cart/clear/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCartItems([]);
      } catch (error) {
        console.error('Error clearing cart:', error);
        alert('Failed to clear cart. Please try again.');
      }
    } else {
      // For non-authenticated users, use local state
      setCartItems([]);
    }
  };

  const updateQuantity = async (productId, delta) => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('accessToken');
        const item = cartItems.find(item => item.id === productId);

        if (item && item.cart_item_id) {
          const newQuantity = Math.max(item.quantity + delta, 1);

          await axios.put(`/api/orders/cart/update/${item.cart_item_id}/`, {
            quantity: newQuantity
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          // Refresh cart after updating item
          const cartResponse = await axios.get('/api/orders/cart/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (cartResponse.data && cartResponse.data.items) {
            const items = cartResponse.data.items.map(item => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              image: item.image,
              quantity: item.quantity,
              selected: true,
              cart_item_id: item.id
            }));

            setCartItems(items);
          }
        }
      } catch (error) {
        console.error('Error updating cart quantity:', error);
        alert('Failed to update quantity. Please try again.');
      }
    } else {
      // For non-authenticated users, use local state
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(item.quantity + delta, 1) }
            : item
        )
      );
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  const getCartCount = () => {
    console.log("Getting cart count, items:", cartItems);
    // Make sure we're returning a number even if cartItems is undefined
    const count = Array.isArray(cartItems) ? cartItems.length : 0;
    console.log("Cart count calculated:", count);
    return count;
  };

  const toggleSelectItem = (productId) => {
    // Selection is only handled client-side for now
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleSelectAll = (checked) => {
    // Selection is only handled client-side for now
    setCartItems(prevItems =>
      prevItems.map(item => ({ ...item, selected: checked }))
    );
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      error,
      addToCart,
      addManyToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      toggleSelectItem,
      toggleSelectAll,
      getSelectedTotal,
      isAuthenticated
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};