import React from "react";
import { FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCart } from "@/contexts/CartContext";

const CartItems = () => {
  const { 
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleSelectItem,
    toggleSelectAll,
    getSelectedTotal
  } = useCart();

  const selectedItems = cartItems.filter((item) => item.selected);
  const total = getSelectedTotal();

  const allSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  return (
    <div className="bg-white shadow p-4 rounded w-full max-w-4xl">
      <p className="text-4xl mb-6">Checkout</p>
      <hr />

      <div className="mb-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"            checked={allSelected}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            className="mr-2 w-5 h-5 rounded transition duration-200 ease-in-out accent-green-500 border-2 border-green-500 checked:bg-green-500 checked:border-green-500"
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
              <td className="py-2">                <input
                  type="checkbox"                  checked={item.selected}
                  onChange={() => toggleSelectItem(item.id)}
                  className="mr-2 w-5 h-5 rounded transition duration-200 ease-in-out accent-green-500 border-2 border-green-500 checked:bg-green-500 checked:border-green-500"
                />
              </td>
              <td className="py-2 flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-16 h-16" />
                <span>{item.name}</span>
              </td>
              <td className="py-2">₱{item.price.toLocaleString()}</td>

              <td className="py-2">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="bg-red-500 text-white rounded px-2 py-1 h-8"
                  >
                    −
                  </button>
                  <span className="inline-flex items-center justify-center h-8 px-2 border rounded">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="bg-green-500 text-white rounded px-2 py-1 h-8"
                  >
                    +
                  </button>
                </div>
              </td>

              <td className="py-2 text-center">
                ₱{(item.price * item.quantity).toLocaleString()}
              </td>
              <td className="py-2">
                <div className="flex items-center justify-center h-full">
                  <TooltipProvider>
                    <Tooltip>                      <TooltipTrigger
                        onClick={() => removeFromCart(item.id)}
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
      </div>      {/* Action Buttons */}
      <div className="flex justify-between mt-4">        <button
          onClick={clearCart}
          disabled={selectedItems.length === 0}
          className={`px-4 py-2 rounded ${
            selectedItems.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}        >
          Clear
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
