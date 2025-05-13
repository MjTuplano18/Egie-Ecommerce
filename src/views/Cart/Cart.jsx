import React from "react";
import CartItems from "./Cart Components/CartItems";
import Order from "./Cart Components/Order";
import OtherCart from "./Cart Components/OtherCart";
import { useCart } from "@/contexts/CartContext";

const Cart = () => {  const { getCartTotal } = useCart();
  const total = getCartTotal();

  return (
    <div className="flex flex-col justify-around p-5">
      <div className="flex flex-row justify-around p-5 gap-4">        <CartItems />
        <Order subtotal={total} total={total} />
      </div>
      <OtherCart />
    </div>
  );
};

export default Cart;
