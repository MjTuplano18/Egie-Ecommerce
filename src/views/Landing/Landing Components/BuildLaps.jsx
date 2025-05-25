import React, { useState, useEffect } from "react";
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

      // Use different endpoint for custom builds
      const url = set === "two"
        ? `http://localhost:8000/api/marketing/custom-builds/?is_public=true`
        : `http://localhost:8000/api/products/?search=${categoryName}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include' // Include cookies for authenticated requests
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);

      // Handle custom builds differently as they have a different structure
      let productList;
      if (set === "two") {
        productList = data.map(build => ({
          id: build.id,
          name: build.name,
          description: build.description || "Custom PC build",
          main_image: "https://via.placeholder.com/300?text=Custom+Build", // Placeholder image
          selling_price: build.total_price,
          stock: 1,
          created_by: build.username || "Anonymous",
          custom_build: true // Flag to identify custom builds
        }));
      } else {
        productList = data.results || data || [];
      }

      setProducts(productList);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${categoryName}:`, err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, [categoryName, set]);

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
            {products.map((product, index) => (              <CarouselItem
                key={index}
                className="flex justify-center basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4 cursor-pointer flex flex-col w-full max-w-[300px]"
                >
                  {product.custom_build && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Custom Build
                    </div>
                  )}
                  <img
                    src={product.main_image || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className={`rounded-md mb-4 object-cover h-40 w-full ${product.custom_build ? 'bg-purple-700' : 'bg-green-700'}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`;
                    }}
                  />
                  <div className="flex flex-col flex-grow justify-between">                    {!product.custom_build && product.stock > 0 && (
                      <span className="text-green-500 text-sm font-semibold mb-2 select-none">
                        In Stock
                      </span>
                    )}
                    {product.custom_build && (
                      <span className="text-purple-500 text-sm font-semibold mb-2 select-none">
                        Built by: {product.created_by || 'Anonymous'}
                      </span>
                    )}
                    <h4 className="select-none text-lg font-medium text-gray-800 mb-1 overflow-hidden text-ellipsis">
                      {product.name}
                    </h4>
                    {product.custom_build ? (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {product.description || "Custom PC configuration"}
                      </p>
                    ) : (
                      <span className="text-gray-500 text-sm mb-2 select-none">
                        Reviews ({product.rating || 0})
                      </span>
                    )}
                    <div className="mt-auto">
                      <div className="flex items-center space-x-2">
                        {!product.custom_build && product.original_price && (
                          <span className="line-through text-gray-400 text-sm select-none">
                            ₱{typeof product.original_price === 'number'
                              ? product.original_price.toLocaleString()
                              : parseFloat(product.original_price).toLocaleString()}
                          </span>
                        )}
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