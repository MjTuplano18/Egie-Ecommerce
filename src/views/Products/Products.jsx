import React, { useState, useEffect } from "react";
import SearchFill from "./Product Components/SearchFill";
import ProductGrid from "./ProductGrid/ProductGrid";
import Category from "./Product Components/Category";

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    minPrice: null,
    maxPrice: null,
    brands: [],
    rating: null,
    discounts: [],
  });

  const handleFilterChange = (updatedFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
    }));
  };

  // Add error handling for the entire page
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      <div className="w-full md:w-1/5">
        <SearchFill filters={filters} onChange={handleFilterChange} />
      </div>
      <div className="w-full md:w-4/5 gap-4">
        <Category
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          className="mb-4"
        />
        <ProductGrid 
          selectedCategory={selectedCategory} 
          filters={filters} 
        />
      </div>
    </div>
  );
};

export default Products;