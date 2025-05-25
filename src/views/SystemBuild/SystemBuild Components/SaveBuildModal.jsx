import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const SaveBuildModal = ({ isOpen, onClose, onSave, components, subtotal }) => {
  const [buildName, setBuildName] = useState("My Custom Build");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!buildName.trim()) {
      toast.error("Please enter a build name");
      return;
    }

    setIsSaving(true);
    try {
      const buildData = {
        name: buildName,
        description: description || "Custom PC build created with EGIE System Builder",
        total_price: subtotal,
        is_public: isPublic,
        items_data: components.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          component_type: item.type || 'Unknown'
        }))
      };
      
      await onSave(buildData);
      onClose();
    } catch (error) {
      console.error('Error saving build:', error);
      toast.error("Failed to save build", {
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Save Your Custom Build</DialogTitle>
        </DialogHeader>        <div className="py-4">
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg justify-center">
              {components.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="w-20 h-20 bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={item.imageUrl || item.image || "https://via.placeholder.com/80?text=No+Image"}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/80?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs text-center px-1">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Build Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Build Name
              </label>
              <input
                type="text"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter a name for your build"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 h-24 resize-none"
                placeholder="Add a description of your build..."
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this build public
              </label>
            </div>

            {/* Build Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Build Summary</h4>
              <div className="space-y-2">
                {components.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.type}: {item.name}</span>
                    <span className="text-gray-900">₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-4">
          <DialogClose asChild>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isSaving ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Build"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveBuildModal;