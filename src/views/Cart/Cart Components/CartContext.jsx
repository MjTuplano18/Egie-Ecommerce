import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '@/services/cartService';
import { toast } from 'sonner';

const CART_STORAGE_KEY = 'egie_cart';
const CartContext = createContext();

// Helper functions for localStorage management
const getStoredCart = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading cart from storage:', error);
    return [];
  }
};

const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

const clearStoredCart = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart from storage:', error);
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Function to refresh cart from server
  const refreshCart = async () => {
    if (!isAuthenticated || isSyncing) return;

    try {
      setIsSyncing(true);
      const response = await cartService.getCart();
      if (response && response.items) {
        const mappedItems = response.items.map(item => ({
          id: item.product_id || item.id,
          name: item.name,
          price: item.price || item.unit_price,
          image: item.image || item.image_url,
          quantity: item.quantity,
          variation: item.variation,
          selected: true
        }));
        setCartItems(mappedItems);
        saveCartToStorage(mappedItems); // Keep local storage in sync
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      // If server fails, use local storage as fallback
      const storedCart = getStoredCart();
      if (storedCart.length > 0) {
        setCartItems(storedCart);
      }
    } finally {
      setIsSyncing(false);
    }
  };
  // Get auth state from your auth context/service
  const isAuthenticated = window.localStorage.getItem('accessToken') !== null;

  // Initialize cart on mount and auth state change
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated) {
        await refreshCart();
      } else {
        const storedCart = getStoredCart();
        setCartItems(storedCart);
      }
    };

    initializeCart();
  }, [isAuthenticated]);
  // Handle user login - merge local cart with server cart
  const handleLogin = async () => {
    setLoading(true);
    try {
      console.log('Handling login - merging carts');
      const localCart = getStoredCart();
      console.log('Local cart:', localCart);

      if (localCart.length > 0) {
        // Add all local items to server cart
        for (const item of localCart) {
          try {
            await cartService.addToCart(
              item.id,
              item.quantity,
              item.variation?.id
            );
          } catch (error) {
            console.error('Error adding item to server cart:', error);
          }
        }
      }

      await refreshCart();
      clearStoredCart();
      console.log('Cart merge complete');
    } catch (error) {
      console.error('Failed to handle login:', error);
      toast.error('Failed to sync your cart');
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    try {
      // Save current cart items to local storage before clearing
      saveCartToStorage(cartItems);
      setCartItems([]);
      toast.info('Cart saved locally');
    } catch (error) {
      console.error('Error handling logout:', error);
      toast.error('Failed to save cart locally');
    }
  };

  const addToCart = async (product, retryCount = 0) => {
    if (!product?.id) {
      toast.error('Invalid product');
      return;
    }

    try {
      // Update local state immediately for better UX
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item =>
          item.id === product.id &&
          (!item.variation?.id || item.variation?.id === product.variation?.id)
        );

        const updatedItems = existingItem
          ? prevItems.map(item =>
              item.id === product.id
                ? { ...item, quantity: (parseInt(item.quantity) || 1) + (parseInt(product.quantity) || 1) }
                : item
            )
          : [...prevItems, {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image || product.image_url,
              quantity: parseInt(product.quantity) || 1,
              variation: product.variation,
              selected: true
            }];

        if (!isAuthenticated) {
          saveCartToStorage(updatedItems);
        }
        return updatedItems;
      });

      if (isAuthenticated) {
        const variationId = product.variation ?
          (typeof product.variation === 'object' ? product.variation.id : product.variation) :
          null;

        await cartService.addToCart(
          product.id,
          parseInt(product.quantity) || 1,
          variationId
        );
        await refreshCart();
        toast.success('Added to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      if (error.response?.status === 401 && !isAuthenticated) {
        // Save to local storage if unauthorized
        saveCartToStorage(cartItems);
        toast.info('Added to local cart only (not logged in)');
      } else if (retryCount < 2) {
        // Retry up to 2 times
        setTimeout(() => addToCart(product, retryCount + 1), 1000);
      } else {
        toast.error('Failed to add to cart (server error)');
      }
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      // Update local state immediately
      setCartItems(prevItems => {
        const updatedItems = prevItems.filter(item => item.id !== itemId);
        saveCartToStorage(updatedItems);
        return updatedItems;
      });

      if (isAuthenticated) {
        await cartService.removeFromCart(itemId);
        await refreshCart();
      }

      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove from cart:', error);

      if (isAuthenticated) {
        toast.error('Removed from local cart only (server error)', {
          description: 'Your cart will be synchronized when connection is restored'
        });
      }
    }
  };

  const updateQuantity = async (itemId, delta) => {
    try {
      const item = cartItems.find(i => i.id === itemId);
      if (!item) return;

      const newQuantity = Math.max(parseInt(item.quantity) + delta, 1);

      // Update local state immediately
      setCartItems(prevItems => {
        const updatedItems = prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        saveCartToStorage(updatedItems);
        return updatedItems;
      });

      if (isAuthenticated) {
        await cartService.updateCartItem(itemId, newQuantity);
        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);

      if (isAuthenticated) {
        toast.error('Updated local cart only (server error)', {
          description: 'Your cart will be synchronized when connection is restored'
        });
      }
    }
  };

  const clearCart = async () => {
    try {
      setCartItems([]);
      clearStoredCart();

      if (isAuthenticated) {
        await cartService.clearCart();
      }

      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);

      if (isAuthenticated) {
        toast.error('Cleared local cart only (server error)', {
          description: 'Your cart will be synchronized when connection is restored'
        });
      }
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price?.replace(/[₱,]/g, '') || '0');
      return total + (price * (parseInt(item.quantity) || 1));
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
  };

  const toggleSelectItem = (productId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleSelectAll = (checked) => {
    setCartItems(prevItems =>
      prevItems.map(item => ({ ...item, selected: checked }))
    );
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price?.replace(/[₱,]/g, '') || '0');
        return total + (price * (parseInt(item.quantity) || 1));
      }, 0);
  };

  const addManyToCart = async (products) => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      toast.error('No products to add');
      return;
    }

    try {
      // Update local state immediately for better UX
      setCartItems(prevItems => {
        let updatedItems = [...prevItems];

        for (const product of products) {
          if (!product?.id) continue;

          const existingItemIndex = updatedItems.findIndex(item =>
            item.id === product.id &&
            (!item.variation?.id || item.variation?.id === product.variation?.id)
          );

          if (existingItemIndex >= 0) {
            // Update existing item
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: (parseInt(updatedItems[existingItemIndex].quantity) || 1) + (parseInt(product.quantity) || 1)
            };
          } else {
            // Add new item
            updatedItems.push({
              id: product.id,
              name: product.productName || product.name,
              price: product.price || product.selling_price,
              image: product.imageUrl || product.image || product.image_url || product.main_image,
              quantity: parseInt(product.quantity) || 1,
              variation: product.variation,
              selected: true
            });
          }
        }

        if (!isAuthenticated) {
          saveCartToStorage(updatedItems);
        }
        return updatedItems;
      });

      if (isAuthenticated) {
        // Add each product to server cart
        for (const product of products) {
          if (!product?.id) continue;

          const variationId = product.variation ?
            (typeof product.variation === 'object' ? product.variation.id : product.variation) :
            null;

          await cartService.addToCart(
            product.id,
            parseInt(product.quantity) || 1,
            variationId
          );
        }

        await refreshCart();
      }
    } catch (error) {
      console.error('Failed to add multiple items to cart:', error);

      if (error.response?.status === 401 && !isAuthenticated) {
        // Save to local storage if unauthorized
        saveCartToStorage(cartItems);
        toast.info('Added to local cart only (not logged in)');
      } else {
        toast.error('Some items may not have been added to cart (server error)');
      }
    }
  };

  const value = {
    cartItems,
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
    loading,
    error
  };

  return (
    <CartContext.Provider value={value}>
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
