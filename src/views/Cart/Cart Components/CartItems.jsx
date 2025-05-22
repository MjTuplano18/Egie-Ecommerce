import React from "react";
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
  updateQuantity,
  toggleSelect,
  toggleSelectAll,
  removeItem,
  clearCart
}) => {
  // If no cart items, display a message
  if (!cartItems || cartItems.length === 0) {
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
            onChange={(e) => toggleSelectAll(e.target.checked)}
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
                  onChange={() => toggleSelect(item.id)}
                  className="mr-2 w-4 h-4 rounded transition duration-200 ease-in-out accent-green-600"
                />
              </td>
              <td className="py-2 flex items-center gap-3">
                <img
                  src={item.image || "https://via.placeholder.com/60"}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/60";
                  }}
                />
                <span className="font-medium">{item.name}</span>
              </td>

              <td className="py-2">₱{(item.price || 0).toLocaleString()}</td>

              <td className="py-2">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="bg-red-500 text-white rounded px-2 py-1 h-8 hover:bg-red-600 transition"
                  >
                    −
                  </button>
                  <span className="inline-flex items-center justify-center h-8 px-3 border rounded min-w-[40px]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="bg-green-500 text-white rounded px-2 py-1 h-8 hover:bg-green-600 transition"
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
                        onClick={() => removeItem(item.id)}
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

      <div className="mt-4 text-right font-semibold text-lg">
        Selected Total: ₱{total.toLocaleString()}
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={clearCart}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Clear Cart
        </button>
        <Link
          to="/products"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default CartItems;