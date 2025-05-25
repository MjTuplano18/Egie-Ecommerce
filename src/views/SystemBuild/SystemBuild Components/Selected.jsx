import React, { useState, useEffect } from "react";
import { useCart } from "@/views/Cart/Cart Components/CartContext";
import { toast } from "sonner";
import axios from "axios";
import PCBuildModal from "./PCBuildModal";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Selected = ({ selectedType, onAddProduct }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [brands, setBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedType) return;

      try {
        setLoading(true);
        setError(null);

        const productUrl = new URL('http://localhost:8000/api/products/');        const params = new URLSearchParams();
        params.append('category__name', selectedType);
        if (selectedBrand !== 'all') {
          params.append('brand_names', selectedBrand);
        }
        if (selectedSubcategory !== 'all') {
          params.append('subcategory__name', selectedSubcategory);
        }
        productUrl.search = params.toString();
        const [productsResponse, brandsResponse, subcategoriesResponse] = await Promise.all([
          axios.get(productUrl.toString()),
          axios.get(`http://localhost:8000/api/brands-by-category/?category=${encodeURIComponent(selectedType)}`),
          axios.get(`http://localhost:8000/api/categories/subcategories/?category=${encodeURIComponent(selectedType)}`)
        ]);

        const productsData = productsResponse.data.results || productsResponse.data || [];
        setProducts(productsData);

        const brandsData = brandsResponse.data || [];
        setBrands(brandsData);        const subcategoriesData = subcategoriesResponse.data || [];
        setSubcategories(subcategoriesData);

      } catch (err) {
        console.error("API Error:", err);
        setError("Failed to fetch data from the API");
        setProducts([]);
        setBrands([]);
        setSubcategories([]);
        setAttributeOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedType, selectedBrand, selectedSubcategory]);
  useEffect(() => {
    setSelectedBrand("all");
    setSelectedSubcategory("all");
    setSelectedProduct(null);
    setSearchTerm("");
  }, [selectedType]);
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAdd = (product) => {
    const processedProduct = {
      id: product.id,
      productName: product.name,
      brand: product.brand?.name || "",
      price: product.selling_price,
      attribute_option: product.attribute_option,
      imageUrl: product.image_urls?.[0] || product.main_image
    };

    onAddProduct(selectedType, processedProduct);
    addToCart({ ...processedProduct, quantity: 1 });

    toast.success("Added to cart and build!", {
      description: `${product.name} has been added to your cart and build.`,
    });
  };

  return (
    <div className="p-4 max-w-md border border-gray-300 mx-auto bg-gray-50 h-[500px] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">
        {selectedType ? `Selected ${selectedType}` : "Select a Component Type"}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : selectedType ? (
        <>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />            <div className="flex gap-4 justify-between items-center">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.name}>{subcategory.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {products.length === 0 ? "No products available" : "No products match your filters"}
              </p>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                      {product.image_urls?.[0] || product.main_image ? (
                        <img
                          src={product.image_urls?.[0] || product.main_image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/64?text=Product";
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs text-gray-600 mb-2">
                        {product.brand?.name} - {product.attribute_option}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        ₱{Number(product.selling_price).toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="flex-1 bg-blue-500 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-600 transition"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleAdd(product)}
                          className="flex-1 bg-lime-400 text-black text-sm px-3 py-1.5 rounded hover:bg-lime-500 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center">
          Please select a component type from the left panel.
        </p>
      )}

      {selectedProduct && (
        <PCBuildModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Selected;