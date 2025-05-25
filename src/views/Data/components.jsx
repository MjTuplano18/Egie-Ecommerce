import { useState, useEffect } from 'react';
import axios from 'axios';

// Default system builder categories in case API call fails
const defaultComponents = [
  { type: "Processor" },
  { type: "Motherboard" },
  { type: "RAM" },
  { type: "Storage" },
  { type: "Power Supply" },
  { type: "Case" },
  { type: "Graphics Card" },
  { type: "CPU Cooling" },
  { type: "Case Fan" },
  { type: "Monitor" },
  { type: "Keyboard" },
  { type: "Mouse" },
];

// Custom hook to fetch buildable component categories
export const useComponents = () => {
  const [components, setComponents] = useState(defaultComponents); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/api/categories/');
        const allCategories = response.data;

        // Filter out laptop categories and only keep component categories
        const buildComponents = allCategories.filter(category => {
          const name = category.name.toLowerCase();
          // Exclude laptop category
          if (name.includes('laptop')) return false;

          // Include if it matches any of these common PC component words
          const isComponent = [
            'processor', 'cpu',
            'motherboard', 'mobo',
            'ram', 'memory', 
            'storage', 'ssd', 'hdd', 'drive',
            'power supply', 'psu',
            'case', 'chassis',
            'graphics', 'gpu',
            'cooling', 'fan',
            'monitor', 'display',
            'keyboard',  
            'mouse',
          ].some(term => name.includes(term));

          return isComponent;
        });

        // Map to the format expected by the system builder
        const formattedComponents = buildComponents.map(category => ({
          type: category.name,
          categoryId: category.id
        }));

        setComponents(formattedComponents);
        setError(null);
      } catch (err) {
        console.error('Error fetching buildable components:', err);
        setError(err.message);
        // Fallback to default components on error 
        setComponents(defaultComponents);
      } finally {
        setLoading(false);  
      }
    };

    fetchComponents();
  }, []);

  return { components, loading, error };
};

// For static access to the default components
export const components = defaultComponents;
