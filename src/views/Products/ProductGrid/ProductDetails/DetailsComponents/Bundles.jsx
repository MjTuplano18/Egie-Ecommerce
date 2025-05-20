import React, { useState, useEffect } from "react";
import axios from "axios";

// Default bundles if none are available from the product
const defaultBundles = [
  {
    id: 1,
    title: "ASROCK BUILD AMD RYZEN 5 5600G / ASROCK B450 STEEL...",
    price: 11795.0,
    reviews: "No reviews",
    rating: 5,
    image: "/images/bundle.png"
  },
  {
    id: 2,
    title: "Onikuma TZ5006 5 in 1 Combo Gaming Set --",
    price: 1050.0,
    reviews: "No reviews",
    rating: 0,
    image: "/images/bundle.png"
  },
  {
    id: 3,
    title: "ASROCK BUILD AMD RYZEN 5 4600G / ASROCK B450 STEEL...",
    price: 11380.0,
    reviews: "No reviews",
    rating: 0,
    image: "/images/bundle.png"
  },
  {
    id: 4,
    title: "GIGABYTE BUILD Intel Core I3-10100 / GIGABYTE H510M-K...",
    price: 9750.0,
    reviews: "No reviews",
    rating: 0,
    image: "/images/bundle.png"
  },
];

const Bundles = ({ product }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If product has bundles, use them, otherwise use default bundles
    if (product?.bundles && product.bundles.length > 0) {
      setBundles(product.bundles);
      setLoading(false);
    } else {
      // Simulate loading for demo purposes
      setTimeout(() => {
        setBundles(defaultBundles);
        setLoading(false);
      }, 800);
    }
  }, [product]);

  // Only show bundles for certain product categories
  const shouldShowBundles =
    !product?.category?.name?.toLowerCase().includes('accessory') &&
    !product?.category?.name?.toLowerCase().includes('peripheral');

  if (!shouldShowBundles) {
    return null;
  }

  return (
    <>
      {/* Best Bundles Section */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Best Bundles</h2>

        {loading ? (
          <p>Loading bundles...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
              >
                <img
                  src={bundle.image || "/images/bundle.png"}
                  alt={bundle.title}
                  className="w-full h-40 object-contain mb-3"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/bundle.png";
                  }}
                />
                <h3 className="text-lg font-semibold mb-1 text-gray-800 line-clamp-2">
                  {bundle.title}
                </h3>
                <p className="text-green-600 font-bold mb-1">
                  ₱{typeof bundle.price === 'number' ? bundle.price.toLocaleString() : bundle.price}
                </p>
                <p className="text-sm text-gray-500 mb-2">{bundle.reviews || "No reviews"}</p>
                <div className="text-yellow-400 text-lg">
                  {"⭐".repeat(bundle.rating || 0)}
                  {Array.from({ length: 5 - (bundle.rating || 0) }).map((_, i) => (
                    <span key={i} className="text-gray-300">
                      ☆
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Bundles;
