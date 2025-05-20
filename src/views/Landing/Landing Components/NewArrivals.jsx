import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ProductModal from "../../Products/ProductGrid/ProductModal/ProductModal";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const StarRating = ({ rating }) => {
  const stars = [];
  const totalStars = 5;

  for (let i = 0; i < totalStars; i++) {
    if (rating >= i + 1) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    } else if (rating > i) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-yellow-400" />);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {stars}
      <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
    </div>
  );
};

const NewArrivals = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/api/products/new_arrivals/');

        const data = response.data;
        console.log('New arrivals data:', data);

        const productList = data.results || data || [];
        setProducts(productList);
        setError(null);
      } catch (err) {
        console.error('Error fetching new arrivals:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  // Function to fetch detailed product data when a product is clicked
  const fetchProductDetails = async (productSlug) => {
    try {
      console.log('Fetching detailed product data for slug:', productSlug);
      const response = await axios.get(`http://localhost:8000/api/products/${productSlug}/`);

      const detailedProduct = response.data;
      console.log('Detailed product data:', detailedProduct);
      return detailedProduct;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-8">
        <h2 className="text-2xl font-semibold mb-6">New Arrivals</h2>
        <div className="flex justify-center items-center min-h-[200px]">
          Loading new arrivals...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center my-8">
        <h2 className="text-2xl font-semibold mb-6">New Arrivals</h2>
        <p className="text-red-500">Error loading new arrivals: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center my-8">
        <h2 className="text-2xl font-semibold mb-6">New Arrivals</h2>
        <p className="text-yellow-600">No new arrivals found. Add products and mark them as "New Arrival" in Django admin.</p>
      </div>
    );
  }

  return (
    <div className="text-center my-8">
      <h2 className="text-2xl font-semibold mb-6">New Arrivals</h2>
      <div className="grid grid-cols-3 grid-rows-2 gap-5 w-4/5 mx-auto relative -translate-x-[3%]">
        {products.slice(0, 5).map((product, index) => {
          const gridPosition = [
            "col-start-1 row-start-1 flex-row",
            "col-start-1 row-start-2 flex-row",
            "col-start-2 row-start-1 row-span-2 flex-col items-center justify-center",
            "col-start-3 row-start-1 flex-row",
            "col-start-3 row-start-2 flex-row",
          ];

          return (
            <div
              key={product.id || index}
              onClick={async () => {
                // First set the basic product data to show something immediately
                setSelectedProduct(product);

                // Then fetch detailed product data including variations
                const detailedProduct = await fetchProductDetails(product.slug);
                if (detailedProduct) {
                  setSelectedProduct(detailedProduct);
                }
              }}
              className={`border border-gray-300 rounded-lg p-4 shadow-md cursor-pointer flex ${gridPosition[index]}`}
            >
              <div className="bg-gray-100 p-2 rounded">
                <img
                  src={product.main_image || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`}
                  alt={product.name}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`;
                  }}
                />
              </div>

              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium line-clamp-2">{product.name}</h3>
                <p className="text-base my-2">₱{typeof product.selling_price === 'number'
                  ? product.selling_price.toLocaleString()
                  : parseFloat(product.selling_price).toLocaleString()}</p>
                <Link
                  to={`/products/details/${product.slug}`}
                  className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 inline-block"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default NewArrivals;