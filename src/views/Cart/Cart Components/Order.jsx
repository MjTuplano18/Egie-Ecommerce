import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/views/Cart/Cart Components/CartContext";
import { toast } from "sonner";

const Order = ({ subtotal, discount, total }) => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [orderNote, setOrderNote] = useState("");

  return (
    <div className="bg-white shadow p-4 rounded w-full max-w-sm">
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Add note to your order</h3>
        <textarea
          className="w-full border border-gray-300 rounded p-2"
          placeholder="Write your note here..."
          rows={4}
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
        />
      </div>      <div className="mb-6">
        <h3 className="font-semibold mb-2 border-t pt-2">Order Details</h3>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₱{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Product Discount</span>
          <span className="text-green-600">−₱0</span>
        </div>
        <div className="flex justify-between text-sm font-bold mt-1">
          <span>Total Amount</span>
          <span>₱{subtotal.toLocaleString()}</span>
        </div>
      </div>

      <h3 className="font-semibold mb-4">Delivery Method</h3>
      <div className="flex justify-between mb-6">
        <button
          onClick={() => setDeliveryMethod('delivery')}
          className={`px-4 py-2 rounded transition-colors ${
            deliveryMethod === 'delivery'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Local Delivery
        </button>
        <button
          onClick={() => setDeliveryMethod('pickup')}
          className={`px-4 py-2 rounded transition-colors ${
            deliveryMethod === 'pickup'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Store Pickup
        </button>
      </div>

      <button
        onClick={() => {
          if (cartItems.length === 0) {
            toast.error("Cart is empty", {
              description: "Please add items to your cart before checking out.",
            });
            return;
          }
          if (!deliveryMethod) {
            toast.error("Select delivery method", {
              description: "Please select a delivery method to continue.",
            });
            return;
          }
          // Save order details to localStorage for checkout
          localStorage.setItem('orderDetails', JSON.stringify({
            items: cartItems,
            subtotal,
            discount,
            total,
            deliveryMethod,
            orderNote
          }));
          navigate('/checkout');
        }}
        className="block w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-center"
      >
        Proceed to Checkout ({cartItems.length} items)
      </button>
    </div>
  );
};

export default Order;
