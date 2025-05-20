import React, { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CartItems = ({
  cartItems,
  setCartItems,
  updateQuantity: propUpdateQuantity,
  toggleSelect: propToggleSelect,
  toggleSelectAll: propToggleSelectAll,
  removeItem: propRemoveItem,
  clearCart: propClearCart
}) => {
  // Debug cart items
  useEffect(() => {
    console.log("CartItems component - cartItems:", cartItems);
  }, [cartItems]);

  // If no cart items, display a message
  if (!cartItems || cartItems.length === 0) {
    console.log("Cart is empty, showing empty cart message");
    return (
      <div className="bg-white shadow p-4 rounded w-full max-w-4xl">
        <p className="text-4xl mb-6">Checkout</p>
        <hr />
        <div className="py-8 text-center">
          <p className="text-xl text-gray-500">Your cart is empty</p>
          <Link
            to="/products"
            className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Use the props if provided, otherwise use local functions
  const handleUpdateQuantity = propUpdateQuantity || ((id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(item.quantity + delta, 1),
            }
          : item
      )
    );
  });

  const handleToggleSelect = propToggleSelect || ((id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  });

  const handleToggleSelectAll = propToggleSelectAll || ((checked) => {
    setCartItems((prev) =>
      prev.map((item) => ({ ...item, selected: checked }))
    );
  });

  const handleRemoveItem = propRemoveItem || ((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  });

  const handleClearCart = () => {
    if (propClearCart) {
      propClearCart();
    } else {
      setCartItems([]);
    }
  };

  const selectedItems = cartItems.filter((item) => item.selected);
  const total = selectedItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const allSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  return (
    <div className="bg-white shadow p-4 rounded w-full max-w-4xl">
      <p className="text-4xl mb-6">Checkout</p>
      <hr />

      <div className="mb-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => handleToggleSelectAll(e.target.checked)}
            className="mr-2 w-4 h-4 rounded transition duration-200 ease-in-out accent-green-600"
          />
          <span className="text-sm">Select All</span>
        </label>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="pb-2"></th>
            <th className="text-left pb-2">Product</th>
            <th className="text-left pb-2">Price</th>
            <th className="text-center pb-2">Quantity</th>
            <th className="text-left pb-2">Cart Total</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => handleToggleSelect(item.id)}
                  className="mr-2 w-4 h-4 rounded transition duration-200 ease-in-out accent-green-600"
                />
              </td>
              <td className="py-2 flex items-center gap-3">
                <img
                  src={item.image || "https://via.placeholder.com/60"}
                  alt={item.name}
                  className="w-16 h-16 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/60";
                  }}
                />
                <span>{item.name}</span>
              </td>
              <td className="py-2">₱{(item.price || 0).toLocaleString()}</td>

              <td className="py-2">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="bg-red-500 text-white rounded px-2 py-1 h-8"
                  >
                    −
                  </button>
                  <span className="inline-flex items-center justify-center h-8 px-2 border rounded">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="bg-green-500 text-white rounded px-2 py-1 h-8"
                  >
                    +
                  </button>
                </div>
              </td>

              <td className="py-2 text-center">
                ₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
              </td>
              <td className="py-2">
                <div className="flex items-center justify-center h-full">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => handleRemoveItem(item.id)}
                        className="cursor-pointer"
                      >
                        <FaTrash className="text-red-500 hover:text-red-700 transition" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete item from cart</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Summary */}
      <div className="mt-4 text-right font-semibold text-lg">
        Selected Total: ₱{total.toLocaleString()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handleClearCart}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Clear Cart
        </button>
        <Link
          to="/products"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default CartItems;