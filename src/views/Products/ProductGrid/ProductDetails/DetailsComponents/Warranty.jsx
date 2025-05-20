import React from "react";

const Warranty = ({ product }) => {
  // Get warranty information from product if available
  const warranty = product?.warranty;

  return (
    <>
      {/* Warranty Section */}
      {warranty && (
        <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Warranty</h2>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-700">
              <span className="mr-2 text-lg">🛡️</span> {warranty}
            </li>

            {/* Default warranty policy */}
            <li className="flex items-center text-gray-700 mt-4 text-sm">
              <span className="mr-2">📝</span> Warranty covers manufacturing defects only
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default Warranty;