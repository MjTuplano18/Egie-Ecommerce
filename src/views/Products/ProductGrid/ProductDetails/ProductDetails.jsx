import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import TopDetails from "./DetailsComponents/TopDetails";
import Description from "./DetailsComponents/Description";
import Reviews from "./DetailsComponents/Reviews";
import CompComponents from "./DetailsComponents/CompComponents";
import Warranty from "./DetailsComponents/Warranty";
import Bundles from "./DetailsComponents/Bundles";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        // Log the ID we're trying to fetch
        console.log("Fetching product with ID:", id);

        try {
          // Using axios instead of fetch
          const response = await axios.get(`http://localhost:8000/api/products/${id}/`);
          console.log("Product data received:", response.data);
          setProduct(response.data);
          setError(null);
        } catch (error) {
          console.log("Error fetching product:", error);
          throw new Error(`Failed to fetch product: ${error.response?.status || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 mt-10">
        <p className="text-lg">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 mt-10">
        <p className="text-red-500 text-lg">Error loading product: {error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64 mt-10">
        <p className="text-yellow-600 text-lg">Product not found</p>
      </div>
    );
  }

  return (
    <>
      <TopDetails product={product} />

      <div className="flex flex-row max-w-7xl mx-auto px-4 py-8 w-[90%] gap-10">
        {/* Details Left*/}
        <div className="flex flex-col mb-4 bg-white p-4 rounded-lg shadow-md pl-7 flex-3/4 w-[95%] h-auto">
          <Description product={product} />

          <Reviews product={product} />

          <CompComponents product={product} />

        </div>

        {/* Details Right */}
        <div className="flex-1/4">
          <Warranty product={product} />

          <Bundles product={product} />
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
