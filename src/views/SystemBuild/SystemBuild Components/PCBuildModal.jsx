import React from "react";
import { IoCloseCircleOutline } from "react-icons/io5";

const PCBuildModal = ({ product, onClose }) => {
  if (!product) {
    console.log('PCBuildModal: No product provided');
    return null;
  }
  
  console.log('PCBuildModal: Rendering with product:', product);
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full h-[90vh] overflow-hidden animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Product Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoCloseCircleOutline size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-4rem)]"> {/* Subtract header height */}
          <div className="p-6 flex-shrink-0">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-6">{product.name}</h3>
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                  {product.image_urls?.[0] || product.main_image ? (
                    <img
                      src={product.image_urls?.[0] || product.main_image}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300?text=Product";
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">No image available</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Specifications - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <h4 className="text-lg font-semibold mb-4 sticky top-0 bg-white py-2">Specifications</h4>
            {product.specifications ? (
              <div className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-1">{key}</div>
                    <div className="text-gray-600">{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-center">No specifications available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCBuildModal;
