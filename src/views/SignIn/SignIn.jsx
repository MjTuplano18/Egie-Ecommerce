import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { IoMdEyeOff } from "react-icons/io";
import { FaGoogle } from "react-icons/fa";
import { auth, googleProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage("Please fill in both fields.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/signin/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        
        // Store JWT tokens
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);

        // Store user data with consistent profile picture handling
        const userData = {
          ...data.user,
          // Store both versions of the profile picture URL for compatibility
          profile_picture: data.user.profile_picture,
          profilePicture: data.user.profile_picture,
          // Handle first/last name consistency
          first_name: data.user.first_name || data.user.username,
          firstName: data.user.first_name || data.user.username,
          last_name: data.user.last_name || '',
          lastName: data.user.last_name || ''
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        window.dispatchEvent(new Event('auth-change'));

        setTimeout(() => navigate("/"), 1500);
      } else {
        setMessage(data.message || "Sign In failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create a user object with consistent structure
      const userData = {
        id: user.uid,
        username: user.displayName || user.email.split('@')[0],
        email: user.email,
        first_name: user.displayName ? user.displayName.split(' ')[0] : '',
        last_name: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
        profilePicture: user.photoURL
      };

      localStorage.setItem("authToken", user.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Dispatch a custom event to notify other components about login
      window.dispatchEvent(new Event('auth-change'));

      setMessage("Google Sign-In Successful!");
      navigate("/");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setMessage("Google Sign-In Failed!");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen text-[#F3F7F6]">
      {/* Left Side */}
      <div className="w-full md:w-1/2 bg-black p-10 shadow-lg flex flex-col justify-center h-full">
        <div className="flex items-center mb-3 justify-center">
          <img
            className="w-28 h-20 object-contain"
            src="https://i.ibb.co/Cpx2BBt5/egie-removebg-preview-1.png"
            alt="Logo"
          />
        </div>

        <h2 className="font-bold text-3xl mb-2 text-center">
          Power Up Your Build – Premium Parts. Peak Performance.
        </h2>
        <p className="mb-4 text-center">
          Welcome back! Please login to your account to continue
        </p>

        {/* Email */}
        <label className="text-sm" htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          className="p-2 border border-gray-300 rounded w-full text-black mb-4"
          placeholder="wayne.enterprises@gotham.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <div className="mb-4">
          <div className="flex justify-between">
            <label className="text-sm" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="text-blue-500 text-sm ml-4">Forgot Password</Link>
          </div>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="p-2 border border-gray-300 rounded w-full pr-10 text-black"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? <IoMdEyeOff className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs mb-4">
          By signing in, you agree to our{" "}
          <a href="#" className="text-blue-500">Terms and Conditions</a> and{" "}
          <a href="#" className="text-blue-500">Privacy Policy</a>.
        </p>

        {/* Login Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-[60%] bg-green-500 text-white px-4 py-2 rounded-3xl cursor-pointer hover:bg-transparent border hover:border-green-500 hover:text-green-500 transition duration-200"
          >
            {isLoading ? "Signing In..." : "LOG IN"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <p className={`text-center mt-4 ${message.toLowerCase().includes("success") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        {/* OR */}
        <p className="text-center my-4 text-white">OR</p>

        {/* Google Sign In */}
        <div className="flex justify-center">
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center w-[60%] p-3 bg-gray-200 text-black rounded-3xl hover:bg-gray-300 transition duration-200"
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            <span>Google</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="flex justify-center">
          <p className="mt-4 text-sm">
            Don't have an account?{" "}
            <Link to="/auth" className="text-blue-400 underline">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-blue-200 to-purple-200 items-center justify-center">
        <img
          className="w-full h-full object-cover"
          src="https://i.ibb.co/yF04zrC9/vecteezy-computer-electronic-chip-with-processor-transistors-29336852.jpg"
          alt="Computer Illustration"
        />
      </div>
    </div>
  );
};

export default SignIn;