import React, { useState, useEffect } from 'react';
import { FaUser, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ProfileSettings = () => {
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
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('Using token:', token); // Debug log
        
        if (!token) {
          console.log('No token found, using localStorage data');
          const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
          
          setUserData(prevData => ({
            ...prevData,
            firstName: storedUserData.first_name || storedUserData.firstName || '',
            lastName: storedUserData.last_name || storedUserData.lastName || '',
            email: storedUserData.email || '',
            birthDate: storedUserData.birth_date || storedUserData.birthDate || '',
            phoneNumber: storedUserData.phone_number || storedUserData.phoneNumber || '',
            profilePicture: storedUserData.profile_picture || storedUserData.profilePicture || null,
            address: storedUserData.address || {
              addressLine: '',
              city: '',
              province: '',
              postalCode: '',
              country: 'Philippines',
              addressType: 'shipping'
            }
          }));
          return;
        }
        
        // Fetch profile data
        const profileResponse = await fetch('http://127.0.0.1:8000/get-profile/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Fetched profile data:', profileData);
          
          // Fetch address data
          const addressResponse = await fetch('http://127.0.0.1:8000/get-address/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          let addressData = {
            addressLine: '',
            city: '',
            province: '',
            postalCode: '',
            country: 'Philippines',
            addressType: 'shipping'
          };
          
          if (addressResponse.ok) {
            const fetchedAddressData = await addressResponse.json();
            console.log('Fetched address data:', fetchedAddressData);
            
            if (fetchedAddressData) {
              addressData = {
                addressLine: fetchedAddressData.address_line || '',
                city: fetchedAddressData.city || '',
                province: fetchedAddressData.province || '',
                postalCode: fetchedAddressData.postal_code || '',
                country: fetchedAddressData.country || 'Philippines',
                addressType: fetchedAddressData.address_type || 'shipping'
              };
            }
          }
          
          setUserData({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: profileData.email || '',
            birthDate: profileData.birth_date || '',
            phoneNumber: profileData.phone_number || '',
            profilePicture: profileData.profile_picture || null,
            address: addressData
          });
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify({
            ...profileData,
            address: addressData
          }));
        } else {
          console.error('Failed to fetch profile data');
          // Fall back to localStorage
          const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
          setUserData(prevData => ({
            ...prevData,
            firstName: storedUserData.first_name || storedUserData.firstName || '',
            lastName: storedUserData.last_name || storedUserData.lastName || '',
            email: storedUserData.email || '',
            birthDate: storedUserData.birth_date || storedUserData.birthDate || '',
            phoneNumber: storedUserData.phone_number || storedUserData.phoneNumber || '',
            profilePicture: storedUserData.profile_picture || storedUserData.profilePicture || null,
            address: storedUserData.address || {
              addressLine: '',
              city: '',
              province: '',
              postalCode: '',
              country: 'Philippines',
              addressType: 'shipping'
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fall back to localStorage
        const storedUserData = JSON.parse(localStorage.getItem('user')) || {};
        setUserData(prevData => ({
          ...prevData,
          firstName: storedUserData.first_name || storedUserData.firstName || '',
          lastName: storedUserData.last_name || storedUserData.lastName || '',
          email: storedUserData.email || '',
          birthDate: storedUserData.birth_date || storedUserData.birthDate || '',
          phoneNumber: storedUserData.phone_number || storedUserData.phoneNumber || '',
          profilePicture: storedUserData.profile_picture || storedUserData.profilePicture || null,
          address: storedUserData.address || {
            addressLine: '',
            city: '',
            province: '',
            postalCode: '',
            country: 'Philippines',
            addressType: 'shipping'
          }
        }));
      }
    };
    
    fetchUserData();
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prevData => ({
          ...prevData,
          profilePicture: file // Store the file object for upload
        }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Get the access token
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('You must be logged in to update your profile');
        setIsLoading(false);
        return;
      }
      
      console.log('Updating profile with token:', token);
      
      // Get user ID from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id || user?.user_id || user?.pk;
      
      if (!userId) {
        console.log('User data from localStorage:', user);
        toast.error('User ID not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Updating profile for user ID:', userId);
      
      // Create FormData for profile update (including profile picture)
      const formData = new FormData();
      formData.append('first_name', userData.firstName);
      formData.append('last_name', userData.lastName);
      formData.append('phone_number', userData.phoneNumber);
      formData.append('birth_date', userData.birthDate);
      
      // Add profile picture if it's a File object
      if (userData.profilePicture instanceof File) {
        formData.append('profile_picture', userData.profilePicture);
      }
      
      // Add address data
      formData.append('address_line', userData.address.addressLine);
      formData.append('city', userData.address.city);
      formData.append('province', userData.address.province);
      formData.append('postal_code', userData.address.postalCode);
      formData.append('country', userData.address.country);
      formData.append('address_type', userData.address.addressType || 'shipping');
      
      // First, make a GET request to the Django site to get the CSRF cookie
      await fetch('http://127.0.0.1:8000/', {
        method: 'GET',
        credentials: 'include',
      });
      
      // Get CSRF token from cookies
      const getCsrfToken = () => {
        const name = 'csrftoken=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for (let i = 0; i < cookieArray.length; i++) {
          let cookie = cookieArray[i].trim();
          if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
          }
        }
        return '';
      };
      
      const csrfToken = getCsrfToken();
      console.log('CSRF Token:', csrfToken);
      
      // Make a single API call to update everything
      console.log('Sending profile update to API');
      const response = await fetch(`http://127.0.0.1:8000/api/update-profile/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRFToken': csrfToken
          // Don't set Content-Type header when sending FormData, 
          // browser will set it automatically with the correct boundary
        },
        credentials: 'include', // Include cookies if you're using session authentication
        body: formData
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      if (!response.ok) {
        console.error('API error response:', responseData);
        console.error('Response status:', response.status);
        console.error('Response status text:', response.statusText);
        
        let errorMessage = 'Failed to update profile';
        if (typeof responseData === 'object') {
          errorMessage = responseData.message || responseData.detail || JSON.stringify(responseData);
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
        
        toast.error(`Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      console.log('Profile updated successfully:', responseData);
      
      // Update localStorage with new data
      const updatedUserData = {
        ...user,
        first_name: userData.firstName,
        last_name: userData.lastName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone_number: userData.phoneNumber,
        phoneNumber: userData.phoneNumber,
        birth_date: userData.birthDate,
        birthDate: userData.birthDate,
        profile_picture: typeof responseData === 'object' && responseData.profile_picture ? 
          responseData.profile_picture : userData.profilePicture,
        profilePicture: typeof responseData === 'object' && responseData.profile_picture ? 
          responseData.profile_picture : userData.profilePicture,
        address: {
          addressLine: userData.address.addressLine,
          city: userData.address.city,
          province: userData.address.province,
          postalCode: userData.address.postalCode,
          country: userData.address.country,
          addressType: userData.address.addressType || 'shipping'
        }
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Dispatch auth change event to update navbar
      window.dispatchEvent(new Event('auth-change'));

      setIsSaved(true);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md relative">
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
          <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-gray-300">
            {userData.profilePicture ? (
              <img 
                src={userData.profilePicture instanceof File ? URL.createObjectURL(userData.profilePicture) : userData.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <FaUser className="text-gray-400 text-5xl" />
            )}
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
        </div>

        {/* Address Section */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Address Information</h3>

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
        <div className="flex justify-end space-x-4">
          <Link
            to="/"
            className="px-6 py-3 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition duration-300"
          >
            Cancel
          </Link>

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