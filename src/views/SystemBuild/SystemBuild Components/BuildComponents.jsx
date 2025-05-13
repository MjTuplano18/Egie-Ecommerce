import React, { useState } from "react";
import { components } from "../../Data/components";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

const BuildComponents = ({
  selectedType,
  setSelectedType,
  selectedProducts,
  setSelectedProducts,
}) => {
  const { addManyToCart } = useCart();
  const [quantities, setQuantities] = useState(components.map(() => 1));

  const handleDecrease = (index, compType) => {
    if (!selectedProducts[compType]) return;
    setQuantities((prev) =>
      prev.map((qty, i) => (i === index && qty > 0 ? qty - 1 : qty))
    );
  };

  const handleIncrease = (index, compType) => {
    if (!selectedProducts[compType]) return;
    setQuantities((prev) =>
      prev.map((qty, i) => (i === index ? qty + 1 : qty))
    );
  };

  const handleDelete = (index, compType) => {
    setSelectedProducts((prev) => {
      const updated = { ...prev };
      delete updated[compType];
      return updated;
    });
    setQuantities((prev) => prev.map((qty, i) => (i === index ? 1 : qty)));
  };

  const getSelectedProductsWithQuantities = () => {
    return components.reduce((acc, comp, index) => {
      const selectedProduct = selectedProducts[comp.type];
      if (selectedProduct && quantities[index] > 0) {
        acc.push({
          ...selectedProduct,
          quantity: quantities[index]
        });
      }
      return acc;
    }, []);
  };

  const subtotal = components.reduce((acc, comp, index) => {
    const selectedProduct = selectedProducts[comp.type];
    const price = selectedProduct?.price || 0;
    const total = price * quantities[index];
    return acc + total;
  }, 0);

  const handleAddToCart = () => {
    const productsToAdd = getSelectedProductsWithQuantities();
    
    if (productsToAdd.length === 0) {
      toast.error("No components selected", {
        description: "Please add at least one component before adding to cart.",
      });
      return;
    }

    addManyToCart(productsToAdd);
    toast.success("Added to cart!", {
      description: "Your products have been successfully added.",
    });
  };

  return (
    <div className="w-[800px] mb-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 border rounded shadow-sm bg-gray-50 p-4">
          <table className="min-w-full text-sm border border-gray-300 mb-4">
            <thead className="bg-blue-100 text-gray-700 text-left">
              <tr>
                <th className="p-2 border">Components</th>
                <th className="p-2 border">Product</th>
                <th className="p-2 border text-center">Quantity</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp, index) => {
                const selectedProduct = selectedProducts[comp.type];
                const price = selectedProduct?.price || 0;
                const total = price * quantities[index];

                return (
                  <tr key={index} className="bg-white hover:bg-gray-100">
                    <td className="p-2 border">{comp.type}</td>
                    <td className="p-2 border w68">
                      {selectedProduct ? (
                        <span className="text-sm font-medium text-gray-800">
                          {selectedProduct.productName}
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedType(comp.type)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer"
                        >
                          Add a component
                        </button>
                      )}
                    </td>
                    <td className="p-2 border text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleDecrease(index, comp.type)}
                          className={`cursor-pointer bg-red-500 text-white p-1 rounded-full hover:bg-red-600 ${
                            !selectedProduct || quantities[index] <= 1
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={!selectedProduct || quantities[index] <= 1}
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="w-5 text-center">
                          {quantities[index]}
                        </span>
                        <button
                          onClick={() => handleIncrease(index, comp.type)}
                          className={`cursor-pointer bg-green-500 text-white p-1 rounded-full hover:bg-green-600 ${
                            !selectedProduct
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={!selectedProduct}
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-2 border">₱{price.toFixed(2)}</td>
                    <td className="p-2 border">₱{total.toFixed(2)}</td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleDelete(index, comp.type)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 cursor-pointer"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="bg-gray-700 text-white flex justify-between items-center p-4 rounded-md">
            <span className="text-sm font-medium">
              Subtotal: ₱{subtotal.toFixed(2)}
            </span>
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="bg-lime-400 text-black px-6 py-2 rounded hover:bg-lime-500 font-semibold"
              >
                Add to Cart
              </button>
              <Link
                to="/checkout"
                onClick={(e) => {
                  const hasSelection = Object.keys(selectedProducts).length > 0;
                  if (!hasSelection) {
                    e.preventDefault();
                    toast.error("No components selected", {
                      description: "Please add at least one component before proceeding to checkout.",
                    });
                    return;
                  }
                  handleAddToCart();
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold"
              >
                Buy Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildComponents;
