import React, { useState, useEffect } from "react";
import axios from "axios";

const CompComponents = ({ product }) => {
  const [compatibleProducts, setCompatibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompatibleProducts = async () => {
      try {
        console.log("Product data:", product);

        // Check if the product has compatible_builds directly in the object
        if (product?.compatible_builds && product.compatible_builds.length > 0) {
          console.log("Found compatible_builds in product data:", product.compatible_builds);
          setCompatibleProducts(product.compatible_builds);
          setLoading(false);
          return;
        }

        // If we have a product slug, fetch compatible products from the API
        if (product?.slug) {
          try {
            // Use a hardcoded API URL to avoid process.env issues
            const apiUrl = 'http://localhost:8000';
            const url = `${apiUrl}/api/products/${product.slug}/compatible/`;
            console.log("Fetching compatible products from:", url);

            const response = await axios.get(url);
            console.log("API response:", response.data);

            if (response.data && Array.isArray(response.data)) {
              setCompatibleProducts(response.data);
              console.log("Set compatible products from API:", response.data);
            } else {
              console.log("API response is not an array, setting empty array");
              setCompatibleProducts([]);
            }
          } catch (error) {
            console.error("Error fetching compatible products:", error);
            setCompatibleProducts([]);
          } finally {
            setLoading(false);
          }
        } else {
          console.log("No product slug found");
          setCompatibleProducts([]);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in compatible products:", error);
        setCompatibleProducts([]);
        setLoading(false);
      }
    };

    if (product) {
      console.log("Product changed, fetching compatible products");
      fetchCompatibleProducts();
    }
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
              {compatibleProducts.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border p-4 rounded shadow hover:shadow-lg hover:border-blue-500 transition-all duration-200 cursor-pointer bg-white"
                  onClick={() => window.location.href = `/products/details/${item.slug || item.id}`}
                >
                  {(item.image_url || item.main_image) && (
                    <div className="mb-2 flex justify-center">
                      <img
                        src={item.image_url || item.main_image}
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
                  <p className="text-sm text-gray-600 line-clamp-2">{item.short_description || 'No description available'}</p>
                  <p className="font-bold mt-2">
                    ₱ {item.selling_price
                      ? (typeof item.selling_price === 'number'
                         ? item.selling_price.toLocaleString()
                         : parseFloat(item.selling_price)?.toLocaleString())
                      : 'Price unavailable'}
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
