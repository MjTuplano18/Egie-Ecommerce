import React, { useState, useEffect } from 'react';
import { FaUser, FaCheck, FaArrowLeft, FaCamera } from 'react-icons/fa';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { userService } from '../../services/api';

const ProfileSettings = () => {
  // State for local form data (camelCase for frontend)
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    phoneNumber: '',
    profilePicture: null,
    address: {
      addressLine: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Philippines',
      addressType: 'shipping'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch user data from API or fallback to localStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching profile data from API...');
        // Try to fetch profile from API
        const profileData = await userService.getProfile();
        console.log('Received profile data:', profileData);
        
        if (profileData) {
          // Convert snake_case API response to camelCase for frontend
          const mappedProfileData = {
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: profileData.email || '',
            birthDate: profileData.birth_date || '',
            phoneNumber: profileData.phone_number || '',
            profilePicture: profileData.profile_picture || null,
          };
          
          console.log('Mapped profile data:', mappedProfileData);
          
          setUserData(prevData => ({
            ...prevData,
            ...mappedProfileData
          }));
        }
        
        console.log('Fetching address data from API...');
        // Try to fetch address from API
        const addressData = await userService.getAddress();
        console.log('Received address data:', addressData);
        
        if (addressData && Object.keys(addressData).length > 0) {
          const mappedAddressData = {
            address: {
              addressLine: addressData.address_line || '',
              city: addressData.city || '',
              province: addressData.province || '',
              postalCode: addressData.postal_code || '',
              country: addressData.country || 'Philippines',
              addressType: addressData.address_type || 'shipping',
            }
          };
          
          console.log('Mapped address data:', mappedAddressData);
          
          setUserData(prevData => ({
            ...prevData,
            ...mappedAddressData
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data. Using local data instead.');
        
        // Fallback to localStorage
        try {
          console.log('Falling back to localStorage data');
          const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
          console.log('Retrieved localStorage data:', storedUserData);
          
          setUserData(prevData => ({
            ...prevData,
            ...storedUserData
          }));
        } catch (localStorageError) {
          console.error('Error reading from localStorage:', localStorageError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Check for auth tokens on component load 
  useEffect(() => {
    // Debug auth tokens
    const accessToken = localStorage.getItem('accessToken');
    const authToken = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('Available auth tokens:', { 
      accessToken: accessToken ? 'exists' : 'missing', 
      authToken: authToken ? 'exists' : 'missing',
      refreshToken: refreshToken ? 'exists' : 'missing',
      accessTokenLength: accessToken?.length,
      authTokenLength: authToken?.length,
      refreshTokenLength: refreshToken?.length
    });
    
    if (!accessToken && !authToken) {
      console.warn('No authentication tokens found in localStorage');
      toast.warning('You may need to log in again to update your profile.');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (address fields)
      const [parent, child] = name.split('.');
      setUserData(prevData => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value
        }
      }));
    } else {
      // Handle top-level fields
      setUserData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
    
    setIsSaved(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prevData => ({
          ...prevData,
          profilePicture: file // Store the file object for upload
        }));
        setSelectedFile(file);
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSaved(false);
    
    // Track success of each operation
    let profileSuccess = false;
    let addressSuccess = false;

    // Display the current data being submitted
    console.log('Current userData state for submission:', userData);

    // Update user profile
    try {
      console.log('Preparing profile data for backend...');
      
      // Create form data for the backend (camelCase to snake_case)
      const formData = new FormData();
      formData.append('first_name', userData.firstName || '');
      formData.append('last_name', userData.lastName || '');
      formData.append('phone_number', userData.phoneNumber || '');
      formData.append('birth_date', userData.birthDate || '');
      
      console.log('Form data values:', {
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        phone_number: userData.phoneNumber || '',
        birth_date: userData.birthDate || '',
      });
      
      // Add profile picture if selected
      if (selectedFile) {
        console.log('Adding profile picture to form data', selectedFile.name);
        formData.append('profile_picture', selectedFile);
      }
      
      // Send profile update request
      console.log('Sending profile update request...');
      const profileResponse = await userService.updateProfile(formData);
      console.log('Profile update response:', profileResponse);
      profileSuccess = true;
      
      // Update localStorage with profile data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        birthDate: userData.birthDate,
        profilePicture: profileResponse.user?.profile_picture || userData.profilePicture
      };
      console.log('Updating localStorage with user data:', updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (profileError) {
      console.error('Error updating profile:', profileError);
      toast.error(`Profile update failed: ${profileError.message}`);
    }
    
    // Update address separately
    try {
      // Convert address fields from camelCase to snake_case
      console.log('Preparing address data for backend...');
      const addressData = {
        address_line: userData.address.addressLine || '',
        city: userData.address.city || '',
        province: userData.address.province || '',
        postal_code: userData.address.postalCode || '',
        country: userData.address.country || 'Philippines',
        address_type: userData.address.addressType || 'shipping'
      };
      console.log('Address data prepared:', addressData);
      
      // Send address update request
      console.log('Sending address update request...');
      const addressResponse = await userService.updateAddress(addressData);
      console.log('Address update response:', addressResponse);
      addressSuccess = true;
      
      // Update localStorage with address data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        address: userData.address
      };
      console.log('Updating localStorage with address data:', updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (addressError) {
      console.error('Error updating address:', addressError);
      toast.error(`Address update failed: ${addressError.message}`);
    }
    
    // Show appropriate success message
    if (profileSuccess && addressSuccess) {
      setIsSaved(true);
      setSelectedFile(null);
      toast.success('Profile and address updated successfully!');
    } else if (profileSuccess) {
      setIsSaved(true);
      setSelectedFile(null);
      toast.success('Profile updated successfully, but address update failed.');
    } else if (addressSuccess) {
      setIsSaved(true);
      toast.success('Address updated successfully, but profile update failed.');
    } else {
      toast.error('Failed to update both profile and address. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md relative mb-10">
      {/* Back/Exit Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
        <span>Back to Home</span>
      </Link>

      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Profile Settings</h2>

      <form onSubmit={handleSubmit}>
        {/* Profile Picture Section */}
        <div className="mb-8 text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-gray-300 relative group">
            {userData.profilePicture ? (
              <img 
                src={userData.profilePicture instanceof File ? URL.createObjectURL(userData.profilePicture) : userData.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <FaUser className="text-gray-400 text-5xl" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <label htmlFor="profilePicture" className="cursor-pointer text-white">
                <FaCamera className="text-2xl" />
              </label>
            </div>
          </div>
          <label htmlFor="profilePicture" className="cursor-pointer inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300">
            Change Profile Picture
          </label>
          <input
            type="file"
            id="profilePicture"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Personal Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <span>Personal Information</span>
          </h3>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={userData.firstName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={userData.lastName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email Field - Read Only */}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={userData.phoneNumber || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Birth Date */}
          <div className="mb-4">
            <label htmlFor="birthDate" className="block mb-2 text-sm font-medium text-gray-700">Birth Date</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={userData.birthDate || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address.addressLine" className="block mb-2 text-sm font-medium text-gray-700">Street Address</label>
            <textarea
              id="address.addressLine"
              name="address.addressLine"
              value={userData.address.addressLine || ''}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your street address"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address.city" className="block mb-2 text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={userData.address.city || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label htmlFor="address.province" className="block mb-2 text-sm font-medium text-gray-700">Province</label>
              <input
                type="text"
                id="address.province"
                name="address.province"
                value={userData.address.province || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your province"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="address.postalCode" className="block mb-2 text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                value={userData.address.postalCode || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your postal code"
              />
            </div>

            <div>
              <label htmlFor="address.country" className="block mb-2 text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={userData.address.country || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your country"
              />
            </div>
          </div>
        </div>

        {/* Save and Cancel Buttons */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex items-center justify-center px-6 py-3 rounded-md text-white font-medium transition duration-300 ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : isSaved ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : isSaved ? (
              <>
                <FaCheck className="mr-2" /> Saved
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;