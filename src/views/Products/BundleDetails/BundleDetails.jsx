import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import Slider from "react-slick";
import { FaArrowLeft, FaArrowRight, FaFacebook, FaFacebookMessenger } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import { useCart } from "@/views/Cart/Cart Components/CartContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import BundleReviews from './BundleReviews';

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

const BundleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // State management
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [nav1, setNav1] = useState(null);
  const [nav2, setNav2] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);

  // Refs for sliders
  const sliderRef1 = useRef(null);
  const sliderRef2 = useRef(null);

  // Slider settings
  const mainSliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
  };

  const thumbnailSliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    swipeToSlide: true,
    focusOnSelect: true,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
  };

  useEffect(() => {
    const fetchBundleDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching bundle with ID:', id);
        const response = await axios.get(`http://localhost:8000/api/marketing/bundles/${id}/`);
        console.log('Bundle response:', response.data);
        const bundleData = response.data;

        if (!bundleData) {
          throw new Error('No bundle data received');
        }

        // Collect images from bundle and products
        const images = [];

        // Add bundle image if available
        if (bundleData.image) {
          images.push(bundleData.image);
        }

        // Add product images that are already available in the bundle items
        bundleData.items?.forEach(item => {
          if (item.product.main_image) {
            images.push(item.product.main_image);
          }
        });

        const filteredImages = images.filter(Boolean);
        console.log('All images collected:', filteredImages);
        setAllImages(filteredImages);

        // Set reviews from the ratings array
        setReviews(bundleData.ratings?.map(rating => ({
          id: rating.id,
          user_name: rating.username,
          rating: rating.rating,
          review: rating.review,
          created_at: rating.createdAt
        })) || []);

        // Update bundle data with correct price fields
        const finalBundleData = {
          ...bundleData,
          title: bundleData.name,
          price: bundleData.discounted_price,
          original_price: bundleData.total_price,
          sold_count: bundleData.items?.reduce((total, item) => total + (item.product.sales_count || 0), 0) || 0
        };

        setBundle(finalBundleData);
      } catch (error) {
        console.error('Error fetching bundle details:', error);
        setError(error.response?.data?.message || 'Failed to load bundle details');
        toast.error("Failed to load bundle details", {
          description: error.response?.data?.message || "Please try again later"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBundleDetails();
    }
  }, [id]);

  useEffect(() => {
    if (allImages.length > 1 && sliderRef1.current && sliderRef2.current) {
      setNav1(sliderRef1.current);
      setNav2(sliderRef2.current);
    }
  }, [allImages]);
  const handleAddToCart = () => {
    if (!bundle) {
      toast.error("Cannot add to cart", {
        description: "Bundle information is not available"
      });
      return;
    }

    try {
      addToCart({
        id: bundle.id,
        name: bundle.name,
        price: bundle.discounted_price,
        original_price: bundle.total_price,
        image: allImages[0] || "/images/bundle.png",
        quantity: quantity,
        isBundle: true,
        bundleItems: bundle.items.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        }))
      });

      toast.success("Bundle added to cart!", {
        description: "Your bundle has been successfully added."
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("Failed to add to cart", {
        description: "There was an error adding the bundle to cart"
      });
    }
  };

  const handleBuyNow = () => {
    try {
      handleAddToCart();
      navigate("/cart");
    } catch (error) {
      console.error('Error navigating to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 mt-10">
        <p className="text-lg">Loading bundle details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 mt-10">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="flex justify-center items-center h-64 mt-10">
        <p className="text-yellow-600 text-lg">Bundle not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex md:flex-row gap-6 w-[88%] ml-19 mt-10 bg-white p-4 rounded-lg shadow-md pl-7">
        <SliderContainer className="w-full md:w-1/3 mt-15 relative">
          {allImages.length === 1 ? (
            <div className="border-2 h-[300px] flex items-center justify-center">
              <img
                src={allImages[0]}
                alt="Bundle"
                className="object-contain max-h-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/bundle.png";
                }}
              />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Slider {...mainSliderSettings} asNavFor={nav2} ref={sliderRef1} className="product-main-slider">
                  {allImages.map((image, index) => (
                    <div key={index} className="border-2 h-[300px] flex items-center justify-center">
                      <img
                        src={image}
                        alt={`Bundle ${index + 1}`}
                        className="object-contain max-h-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/bundle.png";
                        }}
                      />
                    </div>
                  ))}
                </Slider>
              </div>
              {allImages.length > 1 && (
                <div>
                  <Slider {...thumbnailSliderSettings} asNavFor={nav1} ref={sliderRef2} className="product-thumbnail-slider">
                    {allImages.map((image, index) => (
                      <div key={index} className="border-2 p-1">
                        <img
                          src={image}
                          alt={`Bundle thumbnail ${index + 1}`}
                          className="object-contain max-h-20 cursor-pointer"
                          onClick={() => setCurrentImage(index)}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/bundle.png";
                          }}
                        />
                      </div>
                    ))}
                  </Slider>
                </div>
              )}
            </>
          )}
        </SliderContainer>

        <div className="w-full md:w-2/3 bg-white p-4 rounded-lg">
          <h1 className="text-2xl font-semibold mb-2">{bundle.title}</h1>

          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <div>
              <span>{bundle.rating ? `${bundle.rating} Stars` : "No Ratings Yet"}</span> ·
              <span>{bundle.sold_count ? ` ${bundle.sold_count} Sold` : " 0 Sold"}</span>
            </div>
            <span className="cursor-pointer hover:underline">Report</span>
          </div>

          {bundle.description && (
            <div className="mb-4 text-gray-700">
              <p>{bundle.description.length > 150
                ? `${bundle.description.substring(0, 150)}...`
                : bundle.description}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4">
            <div className="text-2xl font-bold text-green-700">
              ₱{parseFloat(bundle.discounted_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-lg text-gray-500 line-through">
                ₱{parseFloat(bundle.total_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-red-500">
                {bundle.discount_percentage}% OFF
              </div>
            </div>

            <div className="text-green-600 text-sm">
              You Save: ₱{parseFloat(bundle.savings_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center mb-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Share:</span>
              <FaFacebookMessenger className="text-xl hover:text-green-500 cursor-pointer" />
              <FaFacebook className="text-xl hover:text-green-500 cursor-pointer" />
              <AiFillInstagram className="text-2xl hover:text-green-500 cursor-pointer" />
              <FaXTwitter className="text-2xl hover:text-green-500 cursor-pointer" />
            </div>
          </div>

          <div className="mb-6 flex flex-row gap-2">
            <label className="block font-medium">Quantity</label>
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
                onClick={() => setQuantity((prev) => prev + 1)}
                className="px-3 py-1 border rounded hover:bg-gray-100 bg-green-400"
              >
                +
              </button>
            </div>
          </div>

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

      <div className="flex flex-row max-w-7xl mx-auto px-4 py-8 w-[90%] gap-10">
        <div className="flex flex-col mb-4 bg-white p-4 rounded-lg shadow-md pl-7 flex-3/4 w-[95%] h-auto">
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Products Included in Bundle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">              {bundle.items?.map((item, index) => {
                const product = item.product;
                return (
                  <div
                    key={product.id || index}
                    className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer hover:border-green-500"
                    onClick={() => navigate(`/products/details/${product.id}`)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={product.main_image || `/images/placeholder.png`}
                          alt={product.name}
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/placeholder.png";
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-gray-600">Quantity: {item.quantity}</p>
                          <p className="font-medium">₱{parseFloat(item.unit_price).toLocaleString('en-PH')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">                      <h4 className="font-medium mb-2">Specifications:</h4>
                      {(product.spec_entries?.length > 0 || Object.keys(product.specifications || {}).length > 0) ? (
                        <ul className="list-disc list-inside text-gray-600 text-sm">
                          {product.spec_entries?.map((spec, i) => (
                            <li key={i} className="mb-1">
                              <span className="font-medium">{spec.name}:</span> {spec.value}
                            </li>
                          )) || Object.entries(product.specifications || {}).map(([key, value], i) => (
                            <li key={i} className="mb-1">
                              <span className="font-medium">{key}:</span> {value}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 text-sm">Specifications not available</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-8">
            <BundleReviews bundle={bundle} />
          </div>
        </div>
      </div>
    </>
  );
};

export default BundleDetails;