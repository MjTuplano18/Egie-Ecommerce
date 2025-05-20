import React from "react";

const Description = ({ product }) => {
    // Use product data if available, otherwise use default values
    const productName = product?.name || "Product Name";
    const brandName = product?.brand?.name || product?.brand || "Brand";
    const description = product?.description || "No description available";

    // Extract specifications from product if available
    // First try to use spec_entries (from the new ProductSpecification model)
    // If not available, fall back to the specifications JSON field
    const specs = product?.spec_entries || [];
    const hasSpecEntries = specs && specs.length > 0;
    const hasSpecsJson = product?.specifications && Object.keys(product?.specifications).length > 0;

    return (
      <>
        <h1 className="text-2xl font-bold mb-4 mt-4">
          {productName}
        </h1>
        <div className="flex flex-row mb-4">
          <h2 className="text-xl font-semibold">Brand: </h2>
          <span className="mb-4 ml-1">{brandName}</span>
        </div>

        {/* Product Description */}
        <div className="desc">
          <h2 className="text-lg font-semibold mb-2">Product Description</h2>
          <p className="mb-4">
            {description}
          </p>
        </div>

        {/* Product Specifications */}
        {(hasSpecEntries || hasSpecsJson || product?.specs) && (
          <div className="specs">
            <h2 className="text-lg font-semibold mb-2">Product Specifications</h2>
            <ul className="list-disc list-inside mb-4">
              {hasSpecEntries ? (
                // Display specifications from the new ProductSpecification model
                specs.map((spec, index) => (
                  <li key={index}>{spec.name}: {spec.value}</li>
                ))
              ) : hasSpecsJson ? (
                // Fall back to specifications JSON field
                Object.entries(product.specifications).map(([key, value], index) => (
                  <li key={index}>{key}: {value}</li>
                ))
              ) : product?.specs ? (
                // Legacy support for specs field
                Object.entries(product.specs).map(([key, value], index) => (
                  <li key={index}>{key}: {value}</li>
                ))
              ) : (
                <li>No specifications available</li>
              )}
            </ul>
          </div>
        )}



        <hr className="border-t-2 border-black my-4" />
      </>
    );
}

export default Description;