import React, { useState, useEffect, useRef } from "react";
import {Link} from "react-router-dom";
import "../../../../src/index.css";
import "flowbite";
import { IoNotifications } from "react-icons/io5";
import { IoBookmark } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { FaBookmark } from "react-icons/fa";
import { FaUser } from "react-icons/fa";

const categorizedParts = [
  {
    category: "Core Components",
    items: [
      "Processor",
      "Motherboard",
      "RAM",
      "Storage 1",
      "Storage 2",
      "Storage 3",
      "GPU",
      "PSU",
    ],
  },
  {
    category: "Case & Cooling",
    items: [
      "Case",
      "Fan",
      "Extra (AIO)",
      "Extra (Fan)",
    ],
  },
  {
    category: "Peripherals",
    items: [
      "Monitor",
      "Keyboard",
      "Mouse",
      "Headset / Speaker",
      "Extra (Webcam)",
    ],
  },
  {
    category: "Miscellaneous",
    items: [
      "Extra",
      "Extra",
      "Extra",
    ],
  },
];

const Navbar = ({isAuth}) => {
  const [cartCount, setCartCount] = useState(2); // example
  const [notificationCount, setNotificationCount] = useState(3); // example
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const location = useLocation();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

<<<<<<< HEAD
  // Check if current route is in auth flows that shouldn't show profile nav
  const isAuthFlow = location.pathname.includes('/forgot-password') || 
                    location.pathname.includes('/reset-password') ||
                    location.pathname.includes('/signin') ||
                    location.pathname.includes('/auth');

  // Function to check auth status
  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('authToken'); // Changed from accessToken to authToken
      const userDataString = localStorage.getItem('user');
      
      console.log("Checking auth status:", { hasToken: !!token, hasUserData: !!userDataString });
      
      if (token && userDataString) {
        try {
          const parsedUserData = JSON.parse(userDataString);
          console.log("User data found:", parsedUserData);
          setUserData(parsedUserData);
=======
  // Fetch user data from localStorage on component mount and when auth changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const userDataString = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (userDataString && accessToken && refreshToken) {
        try {
          const userData = JSON.parse(userDataString);
          // Handle both profile_picture and profilePicture properties
          if (userData.profile_picture && !userData.profilePicture) {
            userData.profilePicture = userData.profile_picture;
          }
          setUserData(userData);
>>>>>>> 3d30cb78a0d4d3c096a0c7a21b2f71090cd2af5e
          setIsSignedIn(true);
        } catch (error) {
          console.error("Error parsing user data:", error);
          setIsSignedIn(false);
          setUserData(null);
        }
      } else {
        console.log("No token or user data found");
        setIsSignedIn(false);
        setUserData(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsSignedIn(false);
      setUserData(null);
    }
  };

  useEffect(() => {
    // Check auth status when component mounts
    checkAuthStatus();
<<<<<<< HEAD
    
    // Listen for auth-related events
    const handleAuthChange = () => {
      console.log("Auth change event received");
      checkAuthStatus();
    };
    
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        console.log("Storage change detected:", e.key);
=======

    // Listen for auth change events
    window.addEventListener('auth-change', checkAuthStatus);

    // Add event listener for storage changes (for multi-tab support)
    window.addEventListener('storage', (event) => {
      if (event.key === 'accessToken' || event.key === 'refreshToken' || event.key === 'user') {
>>>>>>> 3d30cb78a0d4d3c096a0c7a21b2f71090cd2af5e
        checkAuthStatus();
      }
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isProductsActive = location.pathname.startsWith("/products");
  const isActive = (path) => location.pathname === path;

  const handleSignOut = () => {
<<<<<<< HEAD
    // Clear all auth data
    localStorage.removeItem('authToken'); // Changed from accessToken to authToken
=======
    // Clear user session data and tokens
    localStorage.removeItem('accessToken');
>>>>>>> 3d30cb78a0d4d3c096a0c7a21b2f71090cd2af5e
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    setUserData(null);
    setIsSignedIn(false);
    
    // Dispatch auth change event
    window.dispatchEvent(new Event('auth-change'));
    
    navigate("/signin");
  };

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Replace this with your actual search logic
      alert(`Searching for: ${searchQuery}`);
    }
  };

  // Get user's display name
  const getUserDisplayName = () => {
    if (!userData) return "User";

    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    } else if (userData.first_name && userData.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    } else if (userData.firstName || userData.first_name) {
      return userData.firstName || userData.first_name;
    } else if (userData.username) {
      return userData.username;
    } else {
      return "User";
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`navbar ${isAuth ? "auth-navbar" : "main-navbar"}`}>
      {isAuth ? (
        <div className="auth-header "></div>
      ) : (
        <div className="main-header">
          <nav className="bg-[#F3F7F6] border-gray-200 ">
            {/* UPPER NAVBAR */}
            <div className="hidden md:block  bg-[#111] text-white text-sm px-5">
              <div className="flex flex-row md:flex-row lg:flex-row md:order-1 justify-between items-center">
                <div className="leading-loose">
                  Mon-Sunday 8:00 AM - 5:30 PM
                </div>
                <div className="">
                  Visit our showroom at 1234 Street Address City Address, 1234{" "}
                  <a href="#">Contact Us</a>
                </div>
                <div className="">Call Us: +639151855519</div>

                <div className="flex gap-2 text-2xl ">
                  <a href="https://www.facebook.com/EGIEGameShop/">
                    <FaSquareFacebook className=" hover:text-[#4AA3E8]" />
                  </a>
                  <a href="https://www.instagram.com/egie_gameshop/">
                    <FaInstagram className="instagram-icon hover:text-[#4AA3E8]" />
                  </a>
                </div>
              </div>
            </div>

            {/* BOTTOM NAVBAR */}
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto bg-transparent">
              {/* LOGO */}
              <Link
                to="/"
                className="flex items-center space-x-3 rtl:space-x-reverse"
              >
                <img
                  src="https://i.ibb.co/Cpx2BBt5/egie-removebg-preview-1.png"
                  className="h-15"
                  alt="EGIE Logo"
                />
              </Link>

              {/* MAIN LINKS */}
              <div
                className="items-center justify-between hidden w-full md:flex md:w-auto md:order-2 sm:order-5 md:bg-[#F3F7F6]"
                id="navbar-user"
              >
                {/* Search bar for mobile */}
                <div className="relative mt-3 md:hidden">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search-navbar"
                    className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search..."
                  />
                </div>
                <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg  md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0">
                  <li>
                    <Link
                      to="/"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        isActive("/")
                          ? "text-blue-700 font-semibold"
                          : "text-gray-900"
                      } hover:text-black`}
                      aria-current="page"
                    >
                      Home
                    </Link>
                  </li>

                  <li>
                    <button
                      id="mega-menu-dropdown-button"
                      data-dropdown-toggle="mega-menu-dropdown"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className={`flex items-center justify-between w-full py-2 px-3 font-medium border-b border-gray-100 md:w-auto md:border-0 md:p-0 cursor-pointer md:bg-[#F3F7F6] ${
                        isProductsActive
                          ? "text-blue-700 font-semibold"
                          : "text-gray-900 hover:text-black"
                      }`}
                    >
                      Products{" "}
                      <svg
                        className="w-2.5 h-2.5 ms-3"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    </button>

                    <div
                      id="mega-menu-dropdown"
                      className={`absolute z-50 ${
                        isDropdownOpen ? "grid" : "hidden"
                      } w-auto grid-cols-2 text-sm bg-white border border-gray-100 rounded-lg shadow-md dark:border-gray-700 md:grid-cols-3 dark:bg-gray-700 `}
                    >
                      {categorizedParts.map((section, index) => (
                        <div
                          key={index}
                          className="p-4 text-gray-900 dark:text-white"
                        >
                          <h3 className="font-bold mb-2">{section.category}</h3>
                          <ul className="space-y-2">
                            {section.items.map((item, idx) => (
                              <li key={idx}>
                                <Link
                                  to="/products"
                                  onClick={() => setIsDropdownOpen(false)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500"
                                >
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </li>
                  <li>
                    <Link
                      to="/buildpc"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        isActive("/buildpc")
                          ? "text-blue-700 font-semibold"
                          : "text-gray-900"
                      } hover:text-black`}
                    >
                      PC Build
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contactus"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        isActive("/contactus")
                          ? "text-blue-700 font-semibold"
                          : "text-gray-900"
                      } hover:text-black`}
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* RIGHT */}
              <div className="flex flex-wrap items-center justify-between md:order-3 mx-5 ">
                <div className="flex items-center md:order-2">
                  {/* Small Screen Search Button */}                  
                  <button
                    type="button"
                    data-collapse-toggle="navbar-user"
                    aria-controls="navbar-search"
                    aria-expanded="false"
                    className="md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 me-1"
                  >
                    <svg
                      className="w-5 h-5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                      />
                    </svg>
                    <span className="sr-only">Search</span>
                  </button>

                  <div
                    className=" relative hidden md:block w-100 mx-5"
                    id="navbar-search"
                  >
                    <input
                      type="text"
                      id="search-navbar"
                      className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex md:order-3 mx-4 auth-buttons">
                  {isSignedIn ? (
                    <>
                      <Link
                        to="/wishlist"
                        className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 "
                      >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                          <FaBookmark />
                        </span>
                      </Link>

                      <Link
                        to="/cart"
                        className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 "
                      >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                          <FaShoppingCart className="cart" />
                        </span>
                        {cartCount > 0 && (
                          <span className="absolute top-2 right-2 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {cartCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/notification"
                        className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 "
                      >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                          <IoNotifications />
                        </span>
                        {notificationCount > 0 && (
                          <span className="absolute top-2 right-2 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {notificationCount}
                          </span>
                        )}
                      </Link>
                    </>
                  ) : !isAuthFlow && (
                    <>
                      <Link
                        to="/signin"
                        className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800"
                      >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                          Sign In
                        </span>
                      </Link>

                      <Link
                        to="/auth"
                        className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800"
                      >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                          Sign Up
                        </span>
                      </Link>
                    </>
                  )}
                </div>

                {/* PROFILE AND HAMBURGER */}
                <div className="flex items-center md:order-4 space-x-3 md:space-x-0 rtl:space-x-reverse">
                  {isSignedIn && (
<<<<<<< HEAD
                    <div className="relative">
                      <button
                        type="button"
                        className="flex text-sm rounded-full md:me-0 focus:ring-4 focus:ring-gray-300"
                        id="user-menu-button"
                        aria-expanded={isUserDropdownOpen}
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      >
                        <span className="sr-only">Open user menu</span>
                        {userData && (userData.profilePicture || userData.profile_picture) ? (
                          <img
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                            src={userData.profilePicture || userData.profile_picture}
                            alt="user photo"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-300 to-lime-300 flex items-center justify-center text-white">
                            <FaUser className="text-lg" />
                          </div>
                        )}
                      </button>

                      {/* Dropdown menu */}
                      <div
                        ref={userDropdownRef}
                        className={`z-50 ${isUserDropdownOpen ? 'block' : 'hidden'} text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-lg`}
                        style={{ 
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '0.5rem',
                          width: '240px'
                        }}
                        id="user-dropdown"
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-center mb-2">
                            {userData && (userData.profilePicture || userData.profile_picture) ? (
                              <img
                                className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-blue-500"
                                src={userData.profilePicture || userData.profile_picture}
                                alt="user photo"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-300 to-lime-300 flex items-center justify-center text-white mr-3">
                                <FaUser className="text-xl" />
                              </div>
                            )}
                            <div>
                              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                                {getUserDisplayName()}
                              </span>
                              <span className="block text-sm text-gray-500 truncate dark:text-gray-400">
                                {userData?.email || "user@example.com"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ul className="py-2" aria-labelledby="user-menu-button">
                          <li>
                            <Link
                              to="/profile/settings"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                            >
                              <FaUser className="mr-2 text-gray-600" />
                              Profile Settings
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/settings"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                            >
                              <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              </svg>
                              Settings
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/orders"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                            >
                              <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                              </svg>
                              Orders
                            </Link>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setIsUserDropdownOpen(false);
                                handleSignOut();
                              }}
                              className="flex w-full items-center text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                            >
                              <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                              </svg>
                              Sign out
                            </button>
                          </li>
                        </ul>
=======
                    <button
                      type="button"
                      className="flex text-sm rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                      id="user-menu-button"
                      aria-expanded="false"
                      data-dropdown-toggle="user-dropdown"
                      data-dropdown-placement="bottom"
                    >
                      <span className="sr-only">Open user menu</span>
                      {userData && userData.profilePicture ? (
                        <img
                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                          src={userData.profilePicture}
                          alt="user photo"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-300 to-lime-300 flex items-center justify-center text-white">
                          <FaUser className="text-lg" />
                        </div>
                      )}
                    </button>
                  )}

                  {/* Dropdown menu */}
                  <div
                    className="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600"
                    id="user-dropdown"
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-center mb-2">
                        {userData && userData.profilePicture ? (
                          <img
                            className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-blue-500"
                            src={userData.profilePicture}
                            alt="user photo"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-300 to-lime-300 flex items-center justify-center text-white mr-3">
                            <FaUser className="text-xl" />
                          </div>
                        )}
                        <div>
                          <span className="block text-sm font-medium text-gray-900 dark:text-white">
                            {getUserDisplayName()}
                          </span>
                          <span className="block text-sm text-gray-500 truncate dark:text-gray-400">
                            {userData?.email || "user@example.com"}
                          </span>
                        </div>
>>>>>>> 3d30cb78a0d4d3c096a0c7a21b2f71090cd2af5e
                      </div>
                    </div>
                  )}

                  <button
                    data-collapse-toggle="navbar-user"
                    type="button"
                    className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    aria-controls="navbar-user"
                    aria-expanded="false"
                  >
                    <span className="sr-only">Open main menu</span>
                    <svg
                      className="w-5 h-5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 17 14"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 1h15M1 7h15M1 13h15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;