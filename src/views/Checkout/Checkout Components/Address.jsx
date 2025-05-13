import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { userService } from "@/services/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Address = () => {
  const [address, setAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check for authentication first
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('Please log in to view your address');
        }

        // Try to get address from API
        const addressData = await userService.getAddress();
        console.log('Received address data:', addressData);
        
        if (addressData) {
          setAddress(addressData);
        } else {
          throw new Error('No address found');
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        setError(error.message);
        toast.error("Could not load address", {
          description: error.message || "Please check your profile settings",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 border-b-2 border-black animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b-2 border-black">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-2">
          <FaMapMarkerAlt className="text-xl text-gray-600 mt-1" />
          <div>
            <h3 className="font-semibold">Delivery Address</h3>
            {address ? (
              <>
                <p className="text-sm text-gray-700">
                  {address.address_line}, {address.city}, {address.province}, {address.country} {address.postal_code}
                </p>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-700">
                  {error || "No address found. Please add your address in profile settings."}
                </p>
                <Link 
                  to="/profile/settings" 
                  className="text-blue-600 hover:underline text-sm inline-block mt-2"
                >
                  {error ? "Update Address" : "Add Address"}
                </Link>
              </div>
            )}
          </div>
        </div>

        {address && (
          <Link 
            to="/profile/settings" 
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            Change
          </Link>
        )}
      </div>
    </div>
  );
};

export default Address;
