import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import {
  FaArrowLeft,
  FaArrowRight,
  FaFacebook,
  FaFacebookMessenger,
} from "react-icons/fa";
import { IoBookmark, IoCloseCircleOutline } from "react-icons/io5";
import { AiFillInstagram } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

// Styled components for slider
const SliderContainer = styled.div`
  position: relative;

  .slick-arrow {
    z-index: 20;
  }

  .slick-prev, .slick-next {
    &:before {
      color: #333;
    }
  }

  .product-main-slider {
    margin-bottom: 15px;
  }

  .product-thumbnail-slider {
    .slick-slide {
      padding: 2px;
    }
  }
`;

const ProductModal = ({ product: initialProduct, onClose }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [product, setProduct] = useState(initialProduct);

  // Fetch complete product details when modal opens
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/products/${initialProduct.slug}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product details:', error);
        // Fall back to initial product data if fetch fails
        setProduct(initialProduct);
      } finally {
        setLoading(false);
      }
    };

    if (initialProduct?.slug) {
      fetchProductDetails();
    }
  }, [initialProduct?.slug]);

  // Default images if product images are not available
  const defaultImages = [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg",
    "image4.jpg",
    "image5.jpg",
    "image6.jpg",
    "image7.jpg",
  ];

  // Get product images or use defaults
  const productImages = React.useMemo(() => {
    let images = [];

    // Check if product has image_urls array
    if (product?.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      console.log('Using image_urls array:', product.image_urls);
      // Filter out any null, undefined or empty strings
      images = product.image_urls.filter(img => img);
    }
    // Check if product has images array and we don't have images yet
    else if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      console.log('Using images array:', product.images);
      // Filter out any null, undefined or empty strings
      images = product.images.filter(img => img);
    }
    // Check if product has product_images array and we don't have images yet
    else if (product?.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      console.log('Using product_images array:', product.product_images);
      // Extract image URLs and filter out any null, undefined or empty strings
      images = product.product_images
        .map(img => img.image_url || img.url || img.image || img)
        .filter(img => img);
    }
    // Fallback to main_image if available and we don't have images yet
    else if (product?.main_image) {
      console.log('Using main_image as fallback:', product.main_image);
      images = [product.main_image];
    }
    // Last resort: use just one default image
    else {
      console.log('Using default image as last resort');
      images = [defaultImages[0]];
    }

    // Remove duplicates and log the final array
    const uniqueImages = [...new Set(images)];
    console.log('Final processed images:', uniqueImages, 'Count:', uniqueImages.length);
    return uniqueImages;
  }, [product]);

  const [nav1, setNav1] = useState(null);
  const [nav2, setNav2] = useState(null);
  let sliderRef1 = useRef(null);
  let sliderRef2 = useRef(null);

  // Get stock from product or use default
  const [selectedStock, setSelectedStock] = useState(product?.stock || 0);
  const [quantity, setQuantity] = useState(1);

  // Reset selectedVariation when a new product is loaded
  useEffect(() => {
    if (product?.id) {
      // Reset selectedVariation to empty when a new product is loaded
      setSelectedVariation('');
      console.log('New product loaded - resetting selectedVariation');
    }
  }, [product?.id]);

  // Debug product information
  useEffect(() => {
    console.log('Product info:', {
      productId: product?.id,
      productStock: product?.stock,
      totalStock: product?.total_stock,
      selectedStock,
      selectedVariation,
      variations: product?.variations,
      hasVariations: product?.has_variations,
      images: product?.images,
      main_image: product?.main_image,
      productImages
    });
  }, [product, selectedStock, selectedVariation, productImages]);

  // Initialize sliders only when there are multiple images
  useEffect(() => {
    if (productImages.length > 1) {
      console.log('Setting up sliders for', productImages.length, 'images');
      setNav1(sliderRef1.current);
      setNav2(sliderRef2.current);
    } else {
      console.log('Only one image, not initializing sliders');
      // Reset both nav states when there's only one image
      setNav1(null);
      setNav2(null);
    }
  }, [productImages.length]);

  // Get variations from product if available, otherwise use empty array
  const variations = product?.variations?.length > 0
    ? product.variations.map((variation) => ({
        id: variation.id,
        name: variation.name,
        price: variation.final_price ||
               (parseFloat(product.selling_price) + parseFloat(variation.price_adjustment)) ||
               product.selling_price || 0,
        stock: variation.stock || 0,
        is_default: variation.is_default || false
      }))
    : [];

  // Update selected stock when component mounts or when product changes
  useEffect(() => {
    // If no variations, use product stock
    if (!product?.variations?.length) {
      setSelectedStock(product?.stock || 0);
      console.log('Using product stock:', product?.stock);
    } else if (selectedVariation) {
      // If variation is selected, find its stock
      const variation = variations.find(v => v.name === selectedVariation);
      if (variation) {
        setSelectedStock(variation.stock);
        console.log('Using selected variation stock:', variation.stock, 'for variation:', selectedVariation);
      }
    } else {
      // Default to product stock if no variation selected
      // No longer auto-selecting variations - user must explicitly choose
      setSelectedStock(product?.stock || 0);
      console.log('No variation selected - using product stock:', product?.stock);
    }
  }, [product, selectedVariation, variations]);

  const CustomNextArrow = ({ onClick }) => (
    <div
      className="absolute top-1/2 right-[-20px] transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-200 transition"
      onClick={onClick}
      style={{ zIndex: 20 }}
    >
      <FaArrowRight />
    </div>
  );

  const CustomPrevArrow = ({ onClick }) => (
    <div
      className="absolute top-1/2 left-[-20px] transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-200 transition"
      onClick={onClick}
      style={{ zIndex: 20 }}
    >
      <FaArrowLeft />
    </div>
  );

  const handleAddToCart = () => {
    // Check if product is in stock
    if (selectedStock <= 0) {
      toast.error("Product is out of stock", {
        description: "This product is currently unavailable"
      });
      return;
    }

    // If product has variations but none selected, use base price
    if (variations.length > 0 && !selectedVariation) {
      // Use base product price and stock
      console.log('No variation selected, using base product price');
    }

    // Find the selected variation to get its price
    let price = product.selling_price;
    if (selectedVariation) {
      const variation = variations.find(v => v.name === selectedVariation);
      if (variation && variation.price) {
        price = variation.price;
      }
    }

    addToCart({
      id: product.id,
      name: product.name || product.title || product.productName,
      price: typeof price === 'number'
        ? price
        : (typeof price === 'string'
          ? parseFloat(price.replace(/[₱,]/g, ''))
          : price || 0),
      image: product.main_image || (productImages.length > 0 ?
        (typeof productImages[0] === 'string' ? productImages[0] :
        (productImages[0]?.image_url || productImages[0]?.url || productImages[0]?.image || '')) : ''),
      quantity: quantity,
      variation: selectedVariation || null,
      stock: selectedStock // Include stock information
    });

    toast.success("Added to cart!", {
      description: "Your product has been successfully added."
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  if (!product) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-[999]"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg w-[80%] max-h-[85vh] overflow-y-auto shadow-lg relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="cursor-pointer absolute top-2 right-2 text-3xl text-gray-600 hover:text-gray-800 transition mt-10"
          onClick={onClose}
        >
          <IoCloseCircleOutline />
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Image Display */}
          <SliderContainer className="w-full md:w-1/3 mt-15 relative">
            {/* Single Image Display - No Slider */}
            {productImages.length === 1 ? (
              <div className="border-2 h-[300px] flex items-center justify-center">
                <img
                  src={typeof productImages[0] === 'string'
                    ? productImages[0]
                    : (productImages[0]?.image_url || productImages[0]?.url || productImages[0]?.image || '')}
                  alt="Product image"
                  className="object-contain max-h-full"
                  onError={(e) => {
                    console.log(`Image failed to load`);
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/300?text=${encodeURIComponent(product.name || 'Product Image')}`;
                  }}
                />
              </div>
            ) : (
              /* Multiple Images - Use Sliders */
              <>
                {/* Main Slider */}
                <div className="mb-4 relative z-[1]">
                  <Slider
                    asNavFor={nav2}
                    ref={(slider) => (sliderRef1.current = slider)}
                    afterChange={(current) => setCurrentImage(current)}
                    className="product-main-slider"
                    arrows={true}
                  >
                    {productImages.map((image, index) => {
                      // Handle different image formats
                      const imageUrl = typeof image === 'string'
                        ? image
                        : (image?.image_url || image?.url || image?.image || '');

                      return (
                        <div
                          key={index}
                          className="border-2 h-[300px] flex items-center justify-center"
                        >
                          <img
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            className="object-contain max-h-full cursor-pointer"
                            onClick={() => setCurrentImage(index)}
                            onError={(e) => {
                              console.log(`Image failed to load: ${imageUrl}`);
                              e.target.onerror = null;
                              e.target.src = `https://via.placeholder.com/300?text=${encodeURIComponent(product.name || 'Product Image')}`;
                            }}
                          />
                        </div>
                      );
                    })}
                  </Slider>
                </div>

                {/* Thumbnail Slider */}
                <div className="mt-4 relative z-[2]">
                  <Slider
                    asNavFor={nav1}
                    ref={(slider) => (sliderRef2.current = slider)}
                    slidesToShow={productImages.length < 4 ? productImages.length : 4}
                    swipeToSlide
                    focusOnSelect
                    arrows={productImages.length > 4}
                    nextArrow={<CustomNextArrow />}
                    prevArrow={<CustomPrevArrow />}
                    afterChange={(current) => setCurrentImage(current)}
                    className="product-thumbnail-slider"
                  >
                    {productImages.map((image, index) => {
                      // Handle different image formats
                      const imageUrl = typeof image === 'string'
                        ? image
                        : (image?.image_url || image?.url || image?.image || '');

                      return (
                        <div key={index} className="border-2 p-1">
                          <img
                            src={imageUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="object-contain max-h-20 cursor-pointer"
                            onClick={() => setCurrentImage(index)}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://via.placeholder.com/80?text=${encodeURIComponent('Thumb')}`;
                            }}
                          />
                        </div>
                      );
                    })}
                  </Slider>
                </div>
              </>
            )}
          </SliderContainer>

          {/* Product Details */}
          <div className="w-full md:w-2/3 bg-white p-4 rounded-lg">
            <h1 className="text-2xl font-semibold mb-2">
              {product?.name || product?.title || "Product Name"}
            </h1>

            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <div>
                <span>{product?.rating ? `${product.rating} Stars` : "No Ratings Yet"}</span> ·
                <span>{product?.sold_count ? ` ${product.sold_count} Sold` : " 0 Sold"}</span>
              </div>
              <span className="cursor-pointer hover:underline">Report</span>
            </div>

            {/* Product Description - Short version */}
            {product?.short_description && (
              <div className="mb-4 text-gray-700">
                <p>{product.short_description.length > 100
                  ? `${product.short_description.substring(0,500)}...`
                  : product.short_description}</p>
              </div>
            )}

            <div className="flex flex-row gap-7">
              <div className="text-2xl font-bold text-green-700 mb-4">
                {(() => {
                  // If variation is selected, show variation price
                  if (selectedVariation && variations.length > 0) {
                    const variation = variations.find(v => v.name === selectedVariation);
                    if (variation && variation.price) {
                      return `₱${typeof variation.price === 'number'
                        ? variation.price.toLocaleString()
                        : parseFloat(variation.price).toLocaleString()}`;
                    }
                  }

                  // Otherwise show base product price
                  return product?.selling_price ?
                    `₱${typeof product.selling_price === 'number'
                      ? product.selling_price.toLocaleString()
                      : parseFloat(product.selling_price).toLocaleString()}` :
                    (product?.price || "Price not available");
                })()}
              </div>

              {product?.original_price && product.original_price !== product.selling_price && (
                <div className="text-lg text-gray-500 line-through mb-4">
                  ₱{typeof product.original_price === 'number'
                    ? product.original_price.toLocaleString()
                    : parseFloat(product.original_price).toLocaleString()}
                </div>
              )}

              <div className="flex items-center mb-4 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Share:</span>
                  <FaFacebookMessenger className="text-xl hover:text-green-500 cursor-pointer" />
                  <FaFacebook className="text-xl hover:text-green-500 cursor-pointer" />
                  <AiFillInstagram className="text-2xl hover:text-green-500 cursor-pointer" />
                  <FaXTwitter className="text-2xl hover:text-green-500 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Variations - if available */}
            {variations.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-medium">Variation</label>
                  {selectedVariation && (
                    <button
                      onClick={() => {
                        setSelectedVariation('');
                        setSelectedStock(product?.stock || 0);
                        console.log('Cleared variation selection');
                      }}
                      className="text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {variations.map((variation) => (
                    <button
                      key={variation.id}
                      onClick={() => {
                        setSelectedVariation(variation.name);
                        setSelectedStock(variation.stock);
                        console.log('Selected variation:', variation.name, 'with price:', variation.price);
                        // Reset quantity if it's more than the new stock
                        if (quantity > variation.stock) {
                          setQuantity(Math.min(quantity, variation.stock || 1));
                        }
                      }}
                      disabled={variation.stock <= 0}
                      className={`border px-3 py-1 rounded ${
                        selectedVariation === variation.name
                          ? 'border-green-500 bg-green-50'
                          : variation.stock <= 0
                            ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'hover:border-black'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{variation.name}</span>
                        {variation.price !== product.selling_price && (
                          <span className="text-sm text-green-600">
                            ₱{parseFloat(variation.price).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {variation.stock > 0
                            ? `${variation.stock} available`
                            : 'Out of stock'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-2 flex flex-row gap-2">
              <label className="block font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1 border rounded hover:bg-gray-100 bg-green-400"
                >
                  −
                </button>
                <input
                  type="text"
                  readOnly
                  value={quantity}
                  className="w-12 text-center border rounded py-1"
                />
                <button
                  onClick={() =>
                    setQuantity((prev) => Math.min(prev + 1, selectedStock))
                  }
                  disabled={quantity >= selectedStock || selectedStock <= 0}
                  className="px-3 py-1 border rounded hover:bg-gray-100 bg-green-400"
                >
                  +
                </button>
                <span className="text-gray-500">
                  {selectedStock > 0
                    ? `${selectedStock} pieces available`
                    : "Out of stock"}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <Link
              to={`/products/details/${product?.slug || product?.id}`}
              className="block text-center text-blue-500 hover:underline mb-4"
              onClick={() => {
                console.log("Navigating to product details with slug/id:", product?.slug || product?.id);
              }}
            >
              View More Details
            </Link>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={selectedStock <= 0}
                className={`flex-1 border font-medium py-2 rounded transition text-center ${
                  selectedStock <= 0
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-green-400 text-black hover:bg-green-900 hover:text-white'
                }`}
              >
                {selectedStock <= 0 ? 'Out of Stock' : 'Add To Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={selectedStock <= 0}
                className={`flex-1 font-medium py-2 rounded transition text-center ${
                  selectedStock <= 0
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-green-400 text-black hover:bg-green-900 hover:text-white'
                }`}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;