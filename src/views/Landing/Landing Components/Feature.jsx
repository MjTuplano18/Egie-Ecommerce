import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Feature = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default image mapping for common categories
  const categoryImages = {
    "processor": "/processor.png",
    "motherboard": "/mother-board.png",
    "graphics card": "/graphics-card.png",
    "memory": "/memory.png",
    "solid state drive": "/storage.png",
    "power supply": "/power-supply.png",
    "pc case": "/cabinet.png",
    "laptop": "/laptop.png",
  };

  // Default categories as fallback
  const defaultCategories = [
    { name: "PROCESSOR", imageUrl: "/processor.png" },
    { name: "MOTHERBOARD", imageUrl: "/mother-board.png" },
    { name: "GRAPHICS CARD", imageUrl: "/graphics-card.png" },
    { name: "MEMORY", imageUrl: "/memory.png" },
    { name: "SOLID STATE DRIVES", imageUrl: "/storage.png" },
    { name: "POWER SUPPLY", imageUrl: "/power-supply.png" },
    { name: "PC CASE", imageUrl: "/cabinet.png" },
    { name: "LAPTOPS", imageUrl: "/laptop.png" },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/categories/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse JSON:', text.substring(0, 100));
          throw new Error('Invalid JSON response from server');
        }
        
        if (!Array.isArray(data)) {
          console.log('Invalid data format, using defaults');
          setCategories(defaultCategories);
          return;
        }

        // Process categories with appropriate images
        const processedCategories = data.map(category => {
          // Find matching image or use placeholder
          const imageKey = Object.keys(categoryImages).find(key => 
            category.name.toLowerCase().includes(key)
          );
          
          return {
            id: category.id,
            name: category.name,
            imageUrl: category.image_url || 
                     (imageKey ? categoryImages[imageKey] : 
                     `https://via.placeholder.com/150?text=${encodeURIComponent(category.name)}`)
          };
        });

        setCategories(processedCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        // Use default categories as fallback
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-left mb-6 text-3xl">Featured Products</p>
        <div className="flex justify-center items-center min-h-[150px]">
          Loading categories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-left mb-6 text-3xl">Featured Products</p>
        <p className="text-yellow-600">Using default categories. {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <p className="text-left mb-6 text-3xl">Featured Products</p>
      <Carousel>
        <CarouselContent>
          {categories.map((category, index) => (
            <CarouselItem
              key={category.id || index}
              className="flex justify-center basis-1/6.5 width-1/6.5"
            >
              <div className="bg-white border border-gray-300 rounded-lg text-center p-1 transition-shadow duration-300 hover:shadow-lg flex flex-row">
                <div className="h-20 w-20 bg-gray-100 flex items-center justify-center">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="max-w-full h-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(category.name)}`;
                    }}
                  />
                </div>
                <div className="mt-4 mx-4 font-bold">
                  <p className="text-sm mb-2 select-none">{category.name}</p>
                  <Link
                    to={`/products?category=${encodeURIComponent(category.name)}`}
                    className="text-blue-500 text-sm select-none"
                  >
                    View More
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default Feature;