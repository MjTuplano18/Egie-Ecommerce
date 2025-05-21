import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Bundles = ({ product }) => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setLoading(true);
        console.log('Fetching bundles...');
        // Fetch recommended (top-rated) bundles
        const response = await axios.get(`http://localhost:8000/api/marketing/bundles/recommended/`);
        console.log('Fetched bundles:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          setBundles(response.data);
        } else {
          console.warn('Unexpected response format:', response.data);
          setBundles([]);
        }
      } catch (error) {
        console.error('Error fetching bundles:', error);
        setBundles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBundles();
  }, []); // Only fetch on component mount

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Best Bundles</h2>

      {loading ? (
        <div className="flex justify-center items-center p-4">
          <p>Loading bundles...</p>  
        </div>
      ) : bundles.length === 0 ? (
        <div className="text-gray-500 text-center p-4">
          <p>No bundles available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              onClick={() => navigate(`/bundles/${bundle.id}`)}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer border hover:border-green-500"
            >
              <img
                src={bundle.image || "/images/bundle.png"}
                alt={bundle.name}
                className="w-full h-40 object-contain mb-3"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/bundle.png";
                }}
              />
              <h3 className="text-lg font-semibold mb-1 text-gray-800 line-clamp-2 hover:text-green-600">
                {bundle.name}
              </h3>
              <div className="flex justify-between items-center mb-2">                <p className="text-green-600 font-bold">
                  ₱{parseFloat(bundle.discounted_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {bundle.discount_percentage > 0 && (
                  <span className="text-red-500 text-sm">
                    {parseFloat(bundle.discount_percentage).toFixed(2)}% OFF
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm text-gray-500">                  <span>Original Price:</span>
                  <span className="line-through">₱{parseFloat(bundle.total_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-red-500">
                  <span>You Save:</span>
                  <span>₱{parseFloat(bundle.savings_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="flex items-center mt-2">
                <div className="text-yellow-400 text-lg mr-2">
                  {"⭐".repeat(Math.round(bundle.average_rating || 0))}
                  {Array.from({ length: 5 - Math.round(bundle.average_rating || 0) }).map((_, i) => (
                    <span key={i} className="text-gray-300">☆</span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">({bundle.item_count} items)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bundles;
