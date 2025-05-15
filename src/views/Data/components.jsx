import { useState, useEffect } from 'react';
import { productService } from '../../services/api';

// Define the category structure (this stays static as it's part of the UI structure)
export const categoryStructure = [
  {
    type: "Processor",
    imageUrl: "/processor.png",
  },
  {
    type: "RAM",
    imageUrl: "/ram.png",
  },
  {
    type: "Keyboard",
    imageUrl: "/keyboard.png",
  },
  {
    type: "Mouse",
    imageUrl: "/mouse.png",
  },
  {
    type: "Headset/Speaker",
    imageUrl: "/headset-speaker.png",
  },
  {
    type: "Extra (AIO)",
    imageUrl: "/aio.png",
  }
];

// Custom hook to fetch products with category mapping
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch all categories first
        const categories = await productService.getCategories();
        
        // For each category structure, fetch its products
        const productsPromises = categoryStructure.map(async (category) => {
          const matchingCategory = categories.find(c => 
            c.name.toLowerCase() === category.type.toLowerCase()
          );
          
          if (matchingCategory) {
            const categoryProducts = await productService.getProductsByCategory(matchingCategory.name);
            return {
              ...category,
              products: categoryProducts.map(p => ({
                id: p.id,
                productName: p.name,
                brand: p.brand.name,
                price: p.selling_price,
                subCategory: p.category.name,
                ratings: p.rating,
                newArrivals: p.is_new_arrival,
                isTopSeller: p.is_top_seller,
                isFeatured: p.is_featured,
                description: p.short_description,
                specifications: p.specifications,
                stock: p.stock,
                imageUrl: p.image_url
              }))
            };
          }
          return { ...category, products: [] };
        });

        const loadedProducts = await Promise.all(productsPromises);
        setProducts(loadedProducts);
        setLoading(false);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

// For components that just need the static structure
export const components = categoryStructure;
