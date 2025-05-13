import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const CustomNextArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 right-[-20px] transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-200 transition"
    onClick={onClick}
  >
    <FaArrowRight />
  </div>
);

const CustomPrevArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 left-[-20px] transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-200 transition"
    onClick={onClick}
  >
    <FaArrowLeft />
  </div>
);

const TopDetails = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const stock = product?.stock || 1404;
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [selectedMonitor, setSelectedMonitor] = useState('');

  const [currentImage, setCurrentImage] = useState(0);
  const images = [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg",
    "image4.jpg",
    "image5.jpg",
    "image6.jpg",
    "image7.jpg",
  ];

  const [nav1, setNav1] = useState(null);
  const [nav2, setNav2] = useState(null);
  let sliderRef1 = useRef(null);
  let sliderRef2 = useRef(null);

  useEffect(() => {
    setNav1(sliderRef1.current);
    setNav2(sliderRef2.current);
  }, []);

  const handleAddToCart = () => {
    if (!selectedVariation || !selectedMonitor) {
      toast.error("Please select all options", {
        description: "You need to select both variation and monitor size"
      });
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.title || product.productName,
      price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[₱,]/g, '')) : product.price,
      image: product.image || images[0],
      quantity: quantity,
      variation: selectedVariation,
      monitorSize: selectedMonitor,
      specs: {
        processor: product.specs?.processor || 'Intel Core i9-13900KS',
        ram: product.specs?.ram || '8GB',
        storage: product.specs?.storage || '256GB SSD',
        graphics: product.specs?.graphics || 'Integrated Graphics'
      },
      description: product.description || 'High-performance desktop computer with latest generation processor'
    };

    addToCart(cartItem);
    toast.success("Added to cart!", {
      description: "Your product has been successfully added."
    });
  };

  const handleBuyNow = () => {
    if (!selectedVariation || !selectedMonitor) {
      toast.error("Please select all options", {
        description: "You need to select both variation and monitor size"
      });
      return;
    }

    handleAddToCart();

    // Save order details to localStorage for checkout
    const orderDetails = {
      items: [{
        id: product.id,
        name: product.title || product.productName,
        price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[₱,]/g, '')) : product.price,
        image: product.image || images[0],
        quantity: quantity,
        variation: selectedVariation,
        monitorSize: selectedMonitor,
        specs: {
          processor: product.specs?.processor || 'Intel Core i9-13900KS',
          ram: product.specs?.ram || '8GB',
          storage: product.specs?.storage || '256GB SSD',
          graphics: product.specs?.graphics || 'Integrated Graphics'
        }
      }],
      total: quantity * (typeof product.price === 'string' ? parseFloat(product.price.replace(/[₱,]/g, '')) : product.price),
      date: new Date().toISOString()
    };

    localStorage.setItem('orderDetails', JSON.stringify(orderDetails));
    navigate("/cart");
  };

  const variations = [
    { id: 1, name: 'a8 7680 8G/120ssd', price: 15009 },
    { id: 2, name: 'a8 7680 8G/256ssd', price: 17741 }
  ];

  const monitorSizes = [
    { id: 1, size: '18.5 inches', price: 0 },
    { id: 2, size: '21.5 inches', price: 1500 },
    { id: 3, size: '23.8 inches', price: 2500 }
  ];

  return (
    <>
      <div className="flex md:flex-row gap-6 w-[88%] ml-19 mt-10 bg-white p-4 rounded-lg shadow-md pl-7">
        {/* Image Slider */}
        <div className="w-full md:w-1/3 mt-15">
          <Slider
            asNavFor={nav2}
            ref={(slider) => (sliderRef1.current = slider)}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="border-2 h-[300px] flex items-center justify-center"
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index}`}
                  className="object-contain max-h-full cursor-pointer"
                  onClick={() => setCurrentImage(index)}
                />
              </div>
            ))}
          </Slider>

          <Slider
            asNavFor={nav1}
            ref={(slider) => (sliderRef2.current = slider)}
            slidesToShow={4}
            swipeToSlide
            focusOnSelect
            arrows
            nextArrow={<CustomNextArrow />}
            prevArrow={<CustomPrevArrow />}
          >
            {images.map((image, index) => (
              <div key={index} className="border-2 p-1">
                <img
                  src={image}
                  alt={`Thumbnail ${index}`}
                  className="object-contain max-h-20 cursor-pointer"
                  onClick={() => setCurrentImage(index)}
                />
              </div>
            ))}
          </Slider>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-2/3 bg-white p-4 rounded-lg">
          <h1 className="text-2xl font-semibold mb-2">
            {product?.title || "Intel Core i9-13900KS Special Edition"}
          </h1>

          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <div>
              <span>No Ratings Yet</span> · <span>0 Sold</span>
            </div>
            <span className="cursor-pointer hover:underline">Report</span>
          </div>

          {/* Product Description */}
          <div className="mb-4 text-gray-700">
            <p>{product?.description || 'Experience unprecedented power with the latest generation processor, perfect for gaming and intensive workloads.'}</p>
          </div>

          {/* Specifications */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Key Specifications:</h3>
            <ul className="list-disc list-inside text-gray-700">
              <li>Processor: {product?.specs?.processor || 'Intel Core i9-13900KS'}</li>
              <li>RAM: {product?.specs?.ram || '8GB DDR4'}</li>
              <li>Storage: {product?.specs?.storage || '256GB SSD'}</li>
              <li>Graphics: {product?.specs?.graphics || 'Integrated Graphics'}</li>
            </ul>
          </div>

          <div className="flex flex-row gap-7">
            <div className="text-2xl font-bold text-green-700 mb-4">
              ₱{selectedVariation && selectedMonitor ?
                (variations.find(v => v.name === selectedVariation)?.price +
                 monitorSizes.find(m => m.size === selectedMonitor)?.price).toLocaleString()
                : (product?.price || "15,009 - 21,741")}
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
          </div>

          {/* Variations */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Variation</label>
            <div className="flex gap-2 flex-wrap">
              {variations.map((variation) => (
                <button
                  key={variation.id}
                  onClick={() => setSelectedVariation(variation.name)}
                  className={`border px-3 py-1 rounded ${
                    selectedVariation === variation.name
                      ? 'border-green-500 bg-green-50'
                      : 'hover:border-black'
                  }`}
                >
                  {variation.name}
                </button>
              ))}
            </div>
          </div>

          {/* Monitor Size */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Monitor</label>
            <div className="flex gap-2 flex-wrap">
              {monitorSizes.map((monitor) => (
                <button
                  key={monitor.id}
                  onClick={() => setSelectedMonitor(monitor.size)}
                  className={`border px-3 py-1 rounded ${
                    selectedMonitor === monitor.size
                      ? 'border-green-500 bg-green-50'
                      : 'hover:border-black'
                  }`}
                >
                  {monitor.size}
                  {monitor.price > 0 && ` (+₱${monitor.price.toLocaleString()})`}
                </button>
              ))}
            </div>
          </div>

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
