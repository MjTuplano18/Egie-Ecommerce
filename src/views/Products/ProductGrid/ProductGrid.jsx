import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ProductModal from "./ProductModal/ProductModal";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Badge } from "@/components/ui/badge";

const ProductGrid = ({ selectedCategory, filters }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching products with filters:', filters);

        // Build filter parameters
        const params = { page: currentPage };

        if (selectedCategory) {
          params.category__name = selectedCategory;
        }

        if (filters.minPrice) {
          params.min_price = filters.minPrice;
        }

        if (filters.maxPrice) {
          params.max_price = filters.maxPrice;
        }

        // Handle multiple brand selections - join with comma for OR filtering
        if (filters.brands && filters.brands.length > 0) {
          params.brand_names = filters.brands.join(',');
        }

        if (filters.rating) {
          // Use rating__gte for "rating and up" filtering
          params.rating__gte = filters.rating;
        }

        console.log('Filter params:', params);

        // Using axios instead of fetch
        const response = await axios.get('http://localhost:8000/api/products/', { params });
        const data = response.data;

        console.log('Products API response:', data);

        setProducts(data.results || []);

        // Handle pagination data
        if (data.count && data.page_size) {
          setTotalPages(Math.ceil(data.count / data.page_size));
          setItemsPerPage(data.page_size);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, filters, currentPage]);

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

  const getPagination = (total, current, delta = 1) => {
    const range = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push("...");
    if (total > 1) range.push(total);

    return range;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Error loading products: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>No products found. Try adjusting your filters or add products in the admin panel.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col w-[97%] mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={async () => {
                // First set the basic product data to show something immediately
                setSelectedProduct(product);

                // Then fetch detailed product data including variations
                const detailedProduct = await fetchProductDetails(product.slug);
                if (detailedProduct) {
                  setSelectedProduct(detailedProduct);
                }
              }}
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
                <p className="text-gray-500 text-sm select-none">
                  {'⭐'.repeat(Math.round(product.rating || 0))}
                </p>
                {product.is_new_arrival && (
                  <Badge
                    variant="outline"
                    className="bg-green-500 text-white hover:bg-green-600 select-none"
                  >
                    New Arrival
                  </Badge>
                )}
                {product.is_top_seller && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500 text-white hover:bg-blue-600 select-none ml-1"
                  >
                    Top Seller
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-6 mb-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="cursor-pointer"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                />
              </PaginationItem>

              {getPagination(totalPages, currentPage).map((page, index) => (
                <PaginationItem key={index} className="cursor-pointer">
                  {page === "..." ? (
                    <span className="px-2 text-gray-500">...</span>
                  ) : (
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                      className={`${
                        currentPage === page ? "bg-green-400 text-white " : ""
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  className="cursor-pointer"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {selectedProduct && (
        <>
          {console.log('Selected product data for modal:', selectedProduct)}
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </>
      )}
    </>
  );
};

export default ProductGrid;