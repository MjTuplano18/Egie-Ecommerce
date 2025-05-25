import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../../../src/index.css";
import "flowbite";
import { useCart } from "@/views/Cart/Cart Components/CartContext";
import { IoNotifications } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import { FaUser } from "react-icons/fa";
import { FaCog, FaSignOutAlt, FaShoppingBag, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaBookmark } from "react-icons/fa";

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
  const { getCartCount } = useCart();
  const [notificationCount, setNotificationCount] = useState(3); // example
  const [isSignedIn, setIsSignedIn] = useState(isAuth);
  const [userData, setUserData] = useState(null);
  const [theme, setTheme] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isProductsActive = location.pathname.startsWith("/products");
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const checkAuthStatus = () => {
      const userDataString = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (userDataString && accessToken && refreshToken) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData.profile_picture && !userData.profilePicture) {
            userData.profilePicture = userData.profile_picture;
          }
          setUserData(userData);
          setIsSignedIn(true);
        } catch (error) {
          console.error("Error parsing user data:", error);
          setIsSignedIn(false);
        }
      } else {
        setIsSignedIn(false);
        setUserData(null);
      }
    };

    checkAuthStatus();

    window.addEventListener('auth-change', checkAuthStatus);

    window.addEventListener('storage', (event) => {
      if (event.key === 'accessToken' || event.key === 'refreshToken' || event.key === 'user') {
        checkAuthStatus();
      }
    });

    return () => {
      window.removeEventListener('auth-change', checkAuthStatus);
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    setIsSignedIn(false);
    setUserData(null);

    window.dispatchEvent(new Event('auth-change'));

    navigate("/signin");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      alert(`Searching for: ${searchQuery}`);
    }
  };

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

  return (
    <div className={`navbar ${isAuth ? "auth-navbar" : "main-navbar"}`}>
      {isAuth ? (
        <div className="auth-header "></div>
      ) : (
        <div className="main-header">
          <nav className="bg-black border-gray-200 fixed w-full top-0 z-50">
            <div className="hidden md:block bg-[#111] text-white text-sm px-5">
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

            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto bg-transparent">
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

              <div
                className="items-center justify-between hidden w-full md:flex md:w-auto md:order-2 sm:order-5 bg-black"
                id="navbar-user"
              >
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0">
                  <li>
                    <Link
                      to="/"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        isActive("/")
                          ? "text-blue-400 font-semibold"
                          : "text-white"
                      } hover:text-gray-300`}
                      aria-current="page"
                    >
                      Home
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/products"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        isProductsActive
                          ? "text-blue-400 font-semibold"
                          : "text-white"
                      } hover:text-gray-300`}
                      aria-current="page"
                    >
                      All Products
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/buildpc"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        isActive("/buildpc")
                          ? "text-blue-400 font-semibold"
                          : "text-white"
                      } hover:text-gray-300`}
                    >
                      PC Build
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contactus"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        isActive("/contactus")
                          ? "text-blue-400 font-semibold"
                          : "text-white"
                      } hover:text-gray-300`}
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between md:order-3 mx-5 ">
                <div className="flex items-center md:order-2">
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

                <div
                  className={`flex md:order-3 mx-4 auth-buttons ${
                    isSignedIn ? "signed-in" : "signed-out"
                  }`}
                >
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
                        {getCartCount() > 0 && (
                          <span className="absolute top-2 right-2 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {getCartCount()}
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
                  ) : (
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

                <div className="flex items-center md:order-4 space-x-3 md:space-x-0 rtl:space-x-reverse">
                  {isSignedIn && (
                    <button
                      ref={buttonRef}
                      type="button"
                      className="flex text-sm rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                      id="user-menu-button"
                      aria-expanded={dropdownOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(!dropdownOpen);
                      }}
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

                  <div
                    ref={dropdownRef}
                    className={`z-50 ${
                      dropdownOpen
                        ? 'block opacity-100 transform translate-y-0'
                        : 'hidden opacity-0 transform -translate-y-2'
                    } absolute top-16 right-0 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-lg dark:bg-gray-700 dark:divide-gray-600 min-w-[250px] transition-all duration-200 ease-in-out`}
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
                      </div>
                    </div>
                    <ul className="py-2" aria-labelledby="user-menu-button">
                      <li>
                        <Link
                          to="/profile/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          <FaUser className="mr-2 text-gray-500" />
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          <FaCog className="mr-2 text-gray-500" />
                          Settings
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/purchases"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          <FaShoppingBag className="mr-2 text-gray-500" />
                          Orders
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          <FaSignOutAlt className="mr-2 text-gray-500" />
                          Sign out
                        </button>
                      </li>
                    </ul>
                  </div>

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