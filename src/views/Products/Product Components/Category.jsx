import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Category = ({ selectedCategory, setSelectedCategory }) => {
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
        
        const data = await response.json();
        console.log('Categories data in Product Category component:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No categories found or invalid data format');
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

        console.log('Processed categories in Product Category component:', processedCategories);
        setCategories(processedCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories in Product Category component:', err);
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="categories-container mt-4 w-[98%] flex justify-center items-center h-20">
        <p>Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="categories-container mt-4 w-[98%] flex justify-center items-center h-20 bg-red-50 border border-red-200 rounded">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="categories-container mt-4 w-[98%] flex justify-center items-center h-20 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-700">No categories found. Please add categories in Django admin.</p>
      </div>
    );
  }

  return (
    <div className="categories-container mt-4 w-[98%]">
      <Carousel>
        <CarouselContent>
          {categories.map((category, index) => (
            <CarouselItem
              key={category.id || index}
              className="flex justify-center basis-1/6.5 width-16.5"
            >
              <div
                onClick={() => setSelectedCategory(category.name)}
                className={`bg-white border rounded-lg text-center p-1 transition-shadow duration-300 hover:shadow-lg flex flex-row cursor-pointer ${
                  selectedCategory === category.name
                    ? "border-green-500"
                    : "border-gray-300"
                }`}
              >
                <div className="h-15 w-20 bg-gray-100 flex items-center justify-center">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="max-w-full h-auto select-none object-contain p-1"
                    draggable="false"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/150?text=${encodeURIComponent(category.name)}`;
                    }}
                  />
                </div>
                <div className="mt-4 mx-4 font-bold">
                  <p className="text-sm mb-2 select-none">{category.name}</p>
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

export default Category;