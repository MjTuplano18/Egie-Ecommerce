import React, { useState, useEffect } from "react";
import axios from "axios";

const CompComponents = ({ product }) => {
  const [compatibleProducts, setCompatibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompatibleProducts = async () => {
      try {
        // Check if the product has related_products from the Django admin
        if (product?.related_products && product.related_products.length > 0) {
          setCompatibleProducts(product.related_products);
          setLoading(false);
        } else if (product?.compatible_products && product.compatible_products.length > 0) {
          // Alternative field name that might be used
          setCompatibleProducts(product.compatible_products);
          setLoading(false);
        } else if (product?.id) {
          // If we have a product ID but no related products directly in the object,
          // fetch them from the API
          try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/products/${product.id}/compatible/`);
            if (response.data && response.data.length > 0) {
              setCompatibleProducts(response.data);
            } else {
              setCompatibleProducts([]);
            }
            setLoading(false);
          } catch (error) {
            console.error("Error fetching compatible products:", error);
            setCompatibleProducts([]);
            setLoading(false);
          }
        } else {
          // No product ID or related products
          setCompatibleProducts([]);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in compatible products:", error);
        setCompatibleProducts([]);
        setLoading(false);
      }
    };

    fetchCompatibleProducts();
  }, [product]);

  // Only show this section if we have compatible products or if the product is in a relevant category
  const shouldShowCompatibleProducts =
    (compatibleProducts && compatibleProducts.length > 0) ||
    (product?.category?.name?.toLowerCase().includes('component')) ||
    (product?.category?.toLowerCase?.() === 'component') ||
    (product?.name?.toLowerCase().includes('gpu')) ||
    (product?.name?.toLowerCase().includes('cpu')) ||
    (product?.name?.toLowerCase().includes('motherboard')) ||
    (product?.name?.toLowerCase().includes('ram')) ||
    (product?.name?.toLowerCase().includes('power supply'));

  if (!shouldShowCompatibleProducts) {
    return null;
  }

  return (
    <>
      <div className="mb-8">
        {/* Compatible Builds */}
          <h2 className="text-lg font-semibold mt-3 mb-2">Compatible Products</h2>

          {loading ? (
            <div className="flex justify-center items-center h-24">
              <p>Loading compatible products...</p>
            </div>
          ) : compatibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {compatibleProducts.map((item) => (
                <div
                  key={item.id}
                  className="border p-4 rounded shadow hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => window.location.href = `/product/${item.id}`}
                >
                  {item.image_url && (
                    <div className="mb-2 flex justify-center">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-24 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description || 'No description available'}</p>
                  <p className="font-bold mt-2">
                    ₱ {typeof item.price === 'number'
                      ? item.price.toLocaleString()
                      : parseFloat(item.price)?.toLocaleString() || 'Price unavailable'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No compatible products available for this item.</p>
          )}
        </div>
    </>
  );
};

export default CompComponents;
