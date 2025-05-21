import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import {
  FaArrowLeft,
  FaArrowRight,
  FaFacebook,
  FaFacebookMessenger,
} from "react-icons/fa";

import { IoBookmark, IoCloseCircleOutline } from "react-icons/io5";
import { AiFillInstagram } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

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

const TopDetails = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const stock = product?.stock || 100;
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [selectedMonitor, setSelectedMonitor] = useState('');

  const [currentImage, setCurrentImage] = useState(0);

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

  // Debug product information
  useEffect(() => {
    console.log('TopDetails - Product info:', {
      id: product?.id,
      name: product?.name,
      images: product?.images,
      image_urls: product?.image_urls,
      product_images: product?.product_images,
      main_image: product?.main_image,
      processedImages: productImages,
      specs: product?.specs,
      specifications: product?.specifications,
      spec_entries: product?.spec_entries
    });
  }, [product, productImages]);

  // Get variations from product if available, otherwise use empty array
  const variations = product?.variations?.length > 0
    ? product.variations.map((variation) => ({
        id: variation.id,
        name: variation.name,
        price: variation.final_price ||
               (parseFloat(product.selling_price) + parseFloat(variation.price_adjustment || 0)) ||
               product.selling_price || 0,
        stock: variation.stock || product.stock || 100,
        is_default: variation.is_default || false
      }))
    : [];

  // Only define monitor sizes for computer products
  const isComputerProduct = product?.category?.name?.toLowerCase().includes('computer') ||
                           product?.name?.toLowerCase().includes('pc') ||
                           product?.name?.toLowerCase().includes('computer');

  const monitorSizes = isComputerProduct ? [
    { id: 1, size: '18.5 inches', price: 0 },
    { id: 2, size: '21.5 inches', price: 1500 },
    { id: 3, size: '23.8 inches', price: 2500 }
  ] : [];

  const handleAddToCart = () => {
    // If product has variations but none selected, use base price
    if (variations.length > 0 && !selectedVariation) {
      // Use base product price and stock
      console.log('No variation selected, using base product price');
    }

    // For computer products that need monitors
    if (isComputerProduct && monitorSizes.length > 0 && !selectedMonitor) {
      toast.error("Please select a monitor size", {
        description: "You need to select a monitor size for this computer"
      });
      return;
    }

    // Determine the price based on variation selection
    let finalPrice = product.selling_price;
    let variationName = null;

    if (selectedVariation) {
      // Find the selected variation to get its price
      const selectedVar = variations.find(v => v.name === selectedVariation);
      if (selectedVar) {
        finalPrice = selectedVar.price;
        variationName = selectedVar.name;
      }
    }

    // Convert price to number if it's a string
    if (typeof finalPrice === 'string') {
      finalPrice = parseFloat(finalPrice.replace(/[₱,]/g, ''));
    }

    const cartItem = {
      id: product.id,
      name: product.name || product.title || product.productName,
      price: finalPrice || 0,
      image: product.main_image || productImages[0],
      quantity: quantity,
      variation: variationName,
      monitorSize: selectedMonitor || null,
      specs: product.spec_entries ?
        product.spec_entries.reduce((obj, item) => {
          obj[item.name] = item.value;
          return obj;
        }, {}) :
        product.specifications ||
        product.specs || {
          processor: null,
          ram: null,
          storage: null,
          graphics: null
        },
      description: product.description || null
    };

    addToCart(cartItem);
    toast.success("Added to cart!", {
      description: "Your product has been successfully added."
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  return (
    <>
      <div className="flex md:flex-row gap-6 w-[88%] ml-19 mt-10 bg-white p-4 rounded-lg shadow-md pl-7">
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
                    alt={`Product ${index + 1}`}
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
          {product?.description && (
            <div className="mb-4 text-gray-700">
              <p>{product.description.length > 150
                ? `${product.description.substring(0, 150)}...`
                : product.description}</p>
            </div>
          )}



          <div className="flex flex-row gap-7">
            <div className="text-2xl font-bold text-green-700 mb-4">
              {(() => {
                // Calculate base price
                let basePrice = 0;

                if (selectedVariation && variations.length > 0) {
                  // Use selected variation price
                  basePrice = variations.find(v => v.name === selectedVariation)?.price || 0;
                } else {
                  // Use default product price
                  basePrice = typeof product?.selling_price === 'number'
                    ? product.selling_price
                    : (product?.selling_price ? parseFloat(product.selling_price) : 0);
                }

                // Add monitor price if selected
                let monitorPrice = 0;
                if (selectedMonitor && isComputerProduct) {
                  const monitor = monitorSizes.find(m => m.size === selectedMonitor);
                  monitorPrice = monitor ? monitor.price : 0;
                }

                // Calculate total price
                const totalPrice = basePrice + monitorPrice;                return totalPrice > 0
                  ? `₱${parseFloat(totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : (product?.price || "Price not available");
              })()}
            </div>

            {product?.original_price && product.original_price !== product.selling_price && !selectedVariation && (
              <div className="text-lg text-gray-500 line-through mb-4">
                ₱{parseFloat(product.original_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      console.log('Selected variation:', variation.name, 'with price:', variation.price, 'stock:', variation.stock);
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
                      <span className="text-sm text-green-600">
                        ₱{parseFloat(variation.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
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

          {/* Monitor Sizes - only for computer products */}
          {isComputerProduct && monitorSizes.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block font-medium">Monitor Size</label>
                {selectedMonitor && (
                  <button
                    onClick={() => {
                      setSelectedMonitor('');
                      console.log('Cleared monitor selection');
                    }}
                    className="text-sm text-green-600 hover:text-green-800 underline"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {monitorSizes.map((monitor) => (
                  <button
                    key={monitor.id}
                    onClick={() => {
                      setSelectedMonitor(monitor.size);
                      console.log('Selected monitor:', monitor.size, 'with price adjustment:', monitor.price);
                    }}
                    className={`border px-3 py-1 rounded ${
                      selectedMonitor === monitor.size
                        ? 'border-green-500 bg-green-50'
                        : 'hover:border-black'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{monitor.size}</span>
                      {monitor.price > 0 && (
                        <span className="text-sm text-green-600">
                          +₱{monitor.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6 flex flex-row gap-2">
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
                onClick={() => setQuantity((prev) => Math.min(prev + 1, stock))}
                className="px-3 py-1 border rounded hover:bg-gray-100 bg-green-400"
              >
                +
              </button>
              <span className="text-gray-500">{stock} pieces available</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 border bg-green-400 text-black font-medium py-2 rounded hover:bg-green-900 hover:text-white transition text-center"
            >
              Add To Cart
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 bg-green-400 text-black font-medium py-2 rounded hover:bg-green-900 hover:text-white transition text-center"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopDetails;
