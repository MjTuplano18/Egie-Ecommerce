import React from "react";
import CartItems from "./Cart Components/CartItems";
import Order from "./Cart Components/Order";
import OtherCart from "./Cart Components/OtherCart";
import { useCart } from "@/views/Cart/Cart Components/CartContext";

const Cart = () => {  
  const { 
    cartItems, 
    updateQuantity, 
    toggleSelectItem, 
    toggleSelectAll, 
    removeFromCart,
    clearCart, 
    getCartTotal,
    getSelectedTotal
  } = useCart();

  const total = getSelectedTotal();
  const subtotal = getCartTotal();

  return (
    <div className="flex flex-col justify-around p-5">
      <div className="flex flex-row justify-around p-5 gap-4">
        <CartItems 
          cartItems={cartItems}
          updateQuantity={updateQuantity}
          toggleSelect={toggleSelectItem}
          toggleSelectAll={toggleSelectAll}
          removeItem={removeFromCart}
          clearCart={clearCart}
        />
        <Order subtotal={subtotal} total={total} />
      </div>
      <OtherCart />
    </div>
  );
};

export default Cart;
