import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductModal from "../../Products/ProductGrid/ProductModal/ProductModal";

const TopSeller = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/products/top_sellers/', {
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Top sellers data:', data);

        const productList = data.results || data || [];
        setProducts(productList);
        setError(null);
      } catch (err) {
        console.error('Error fetching top sellers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellers();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-8">
        <h2 className="text-2xl font-semibold mb-6">Top Sellers</h2>
        <div className="flex justify-center items-center min-h-[200px]">
          Loading top sellers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center my-8">
        <h2 className="text-2xl font-semibold mb-6">Top Sellers</h2>
        <p className="text-red-500">Error loading top sellers: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center my-8">
        <h2 className="text-2xl font-semibold mb-6">Top Sellers</h2>
        <p className="text-yellow-600">No top sellers found. Add products and mark them as "Top Seller" in Django admin.</p>
      </div>
    );
  }

  return (
    <div className="text-center my-8">
      <h2 className="text-2xl font-semibold mb-6">Top Sellers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-4/5 mx-auto">
        {products.slice(0, 10).map((product, index) => (
          <div
            key={product.id || index}
            onClick={() => setSelectedProduct(product)}
            className="bg-white rounded shadow-md p-3 cursor-pointer hover:shadow-lg transition duration-200"
          >
            <div className="w-full h-[150px] bg-gray-100 rounded flex items-center justify-center">
              <img
                src={product.main_image || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`}
                alt={product.name}
                className="max-w-full max-h-full object-contain select-none"
                draggable="false"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`;
                }}
              />
            </div>
            <div className="pt-3">
              <p className="text-sm font-medium select-none line-clamp-2">
                {product.name}
              </p>
              <p className="text-lg font-bold text-red-600 select-none">
                ₱{typeof product.selling_price === 'number'
                  ? product.selling_price.toLocaleString()
                  : parseFloat(product.selling_price).toLocaleString()}
              </p>
              <div className="text-yellow-400 text-sm mb-2">
                {'⭐'.repeat(Math.round(product.rating || 0))}
              </div>
              <Link
                to={`/products/details/${product.slug}`}
                className="block w-full bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 text-sm"
              >
                Shop Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <Link
        to="/products"
        className="bg-black text-white rounded px-6 py-2 text-center mt-6 inline-block hover:bg-gray-900 w-40"
      >
        SEE ALL
      </Link>
    </div>
  );
};

export default TopSeller;