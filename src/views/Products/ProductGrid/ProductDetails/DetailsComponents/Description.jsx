import React from "react";

const Description = ({ product }) => {
  if (!product) return null;
  // Prioritize spec_entries if available, otherwise use specifications
  const specs = product.spec_entries?.length > 0 
    ? product.spec_entries 
    : Object.entries(product.specifications || {}).map(([name, value]) => ({ name, value }));

  return (
    <>
      <h1 className="text-2xl font-bold mb-4 mt-4">
        {product.name}
      </h1>
      <div className="flex flex-row mb-4">
        <h2 className="text-xl font-semibold">Brand: </h2>
        <span className="mb-4 ml-1">{product.brand?.name || "N/A"}</span>
      </div>

      {/* Product Description */}
      <div className="desc">
        <h2 className="text-lg font-semibold mb-2">Product Description</h2>
        <p className="mb-4 whitespace-pre-line">
          {product.description || "No description available"}
        </p>
      </div>

      {/* Product Specifications */}
      {specs?.length > 0 && (
        <div className="specs">
          <h2 className="text-lg font-semibold mb-2">Product Specifications</h2>
          <ul className="list-disc list-inside mb-4">
            {specs.map((spec, index) => (
              <li key={index}>{spec.name}: {spec.value}</li>
            ))}
          </ul>
        </div>
      )}

      <hr className="border-t-2 border-black my-4" />
      </>
    );
}

export default Description;