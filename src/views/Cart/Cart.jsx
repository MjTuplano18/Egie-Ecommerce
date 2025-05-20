
import React, { useState, useEffect } from "react";
import CartItems from "./Cart Components/CartItems";
import Order from "./Cart Components/Order";
import OtherCart from "./Cart Components/OtherCart";
import { useCart } from "@/contexts/CartContext";

const Cart = () => {
  const {
    cartItems,
    toggleSelectItem,
    toggleSelectAll,
    removeFromCart,
    updateQuantity,
    clearCart,
    loading,
    error,
    isAuthenticated
  } = useCart();

  const [localCartItems, setLocalCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);

  // Initialize local cart items from context
  useEffect(() => {
    console.log("Cart items from context:", cartItems);
    setLocalCartItems(cartItems);
  }, [cartItems]);

  // Calculate totals when local cart items change
  useEffect(() => {
    console.log("Calculating totals with localCartItems:", localCartItems);

    if (!localCartItems || localCartItems.length === 0) {
      setSubtotal(0);
      setDiscount(0);
      setTotal(0);
      return;
    }

    const selectedItems = localCartItems.filter((item) => item.selected);
    console.log("Selected items for calculation:", selectedItems);

    const calcSubtotal = selectedItems.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
      0
    );
    const calcDiscount = selectedItems.reduce(
      (acc, item) => acc + (item.discount || 0),
      0
    );
    const calcTotal = calcSubtotal - calcDiscount;

    console.log("Calculated values:", { calcSubtotal, calcDiscount, calcTotal });

    setSubtotal(calcSubtotal);
    setDiscount(calcDiscount);
    setTotal(calcTotal);
  }, [localCartItems]);

  // Handle local cart updates and sync with context
  const handleUpdateQuantity = (id, delta) => {
    updateQuantity(id, delta);
    setLocalCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(item.quantity + delta, 1) }
          : item
      )
    );
  };

  const handleToggleSelect = (id) => {
    toggleSelectItem(id);
    setLocalCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleToggleSelectAll = (checked) => {
    toggleSelectAll(checked);
    setLocalCartItems(prevItems =>
      prevItems.map(item => ({ ...item, selected: checked }))
    );
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
    setLocalCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    clearCart();
    setLocalCartItems([]);
  };

  console.log("Rendering Cart component with localCartItems:", localCartItems);

  return (
    <div className="flex flex-col justify-around p-5">
      <div className="flex flex-row justify-around p-5 gap-4">
        <CartItems
          cartItems={localCartItems}
          setCartItems={setLocalCartItems}
          updateQuantity={handleUpdateQuantity}
          toggleSelect={handleToggleSelect}
          toggleSelectAll={handleToggleSelectAll}
          removeItem={handleRemoveItem}
          clearCart={handleClearCart}
        />
        {localCartItems && localCartItems.length > 0 && (
          <Order subtotal={subtotal} discount={discount} total={total} />
        )}
      </div>
      <OtherCart />
    </div>
  );
};

export default Cart;
