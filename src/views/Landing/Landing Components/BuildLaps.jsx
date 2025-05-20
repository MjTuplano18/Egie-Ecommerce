import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductModal from "../../Products/ProductGrid/ProductModal/ProductModal";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const BuildLaps = ({ set }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine what type of products to fetch based on the 'set' prop
  const categoryName = set === "two" ? "Custom Build" : "Laptop";
  const title = set === "two" ? "Custom Builds" : "Laptops";

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log(`Fetching products for category: ${categoryName}`);
      const response = await axios.get(`http://localhost:8000/api/products/`, {
        params: { search: categoryName }
      });

      const data = response.data;
      console.log('API response data:', data);
      const productList = data.results || data || [];
      setProducts(productList);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${categoryName}:`, err);
      setError(err.response?.data?.message || err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, [categoryName, set]);

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

  // Common title section that stays consistent across all states
  const TitleSection = () => (
    <div className="w-1/3 md:w-1/4 min-w-[200px] mr-6 md:mr-12 px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center bg-amber-800 h-full py-6 rounded-lg">
      <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">{title}</h2>
      <Link
        to={`/products?category=${encodeURIComponent(categoryName)}`}
        className="text-indigo-600 hover:underline text-lg"
      >
        See All {title}
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="product-display flex flex-row p-6">
        <TitleSection />
        <div className="flex-1 flex justify-center items-center min-h-[200px]">
          Loading {title.toLowerCase()}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-display flex flex-row p-6">
        <TitleSection />
        <div className="flex-1 flex justify-center items-center min-h-[200px] text-red-500">
          Error loading {title.toLowerCase()}: {error}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-display flex flex-row p-6">
        <TitleSection />
        <div className="flex-1 flex justify-center items-center min-h-[200px] text-yellow-600">
          No {title.toLowerCase()} found.
        </div>
      </div>
    );
  }

  return (
    <div className="product-display flex flex-row p-6">
      <TitleSection />
      <div className="flex-1">
        <Carousel className="w-full">
          <CarouselContent>
            {products.map((product, index) => (
              <CarouselItem
                key={index}
                className="flex justify-center basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div
                  onClick={async () => {
                    // First set the basic product data to show something immediately
                    setSelectedProduct(product);

                    // Then fetch detailed product data including variations
                    const detailedProduct = await fetchProductDetails(product.slug);
                    if (detailedProduct) {
                      setSelectedProduct(detailedProduct);
                    }
                  }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4 cursor-pointer flex flex-col w-full max-w-[300px]"
                >
                  <img
                    src={product.main_image || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className="rounded-md mb-4 object-cover h-40 w-full bg-green-700"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`;
                    }}
                  />
                  <div className="flex flex-col flex-grow justify-between">
                    {product.stock > 0 && (
                      <span className="text-green-500 text-sm font-semibold mb-2 select-none">
                        In Stock
                      </span>
                    )}
                    <h4 className="select-none text-lg font-medium text-gray-800 mb-1 overflow-hidden text-ellipsis">
                      {product.name}
                    </h4>
                    <span className="text-gray-500 text-sm mb-2 select-none">
                      Reviews ({product.rating || 0})
                    </span>
                    <div className="mt-auto">
                      <div className="flex items-center space-x-2">
                        <span className="line-through text-gray-400 text-sm select-none">
                          ₱{typeof product.original_price === 'number'
                            ? product.original_price.toLocaleString()
                            : parseFloat(product.original_price).toLocaleString()}
                        </span>
                        <span className="text-indigo-600 font-bold text-lg select-none">
                          ₱{typeof product.selling_price === 'number'
                            ? product.selling_price.toLocaleString()
                            : parseFloat(product.selling_price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-1" />
          <CarouselNext className="right-1" />
        </Carousel>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </div>
  );
};

export default BuildLaps;