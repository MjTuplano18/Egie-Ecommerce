import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { IoMdEyeOff } from "react-icons/io";
import { FaGoogle } from "react-icons/fa";
import {
  auth,
  googleProvider,
  sendVerificationEmail
} from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  // Function to check if username already exists
  const checkUsernameExists = async (username) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/check-username/?username=${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await response.json();
      return data.exists; // Assuming the API returns { exists: true/false }
    } catch (error) {
      console.error("Error checking username:", error);
      return false; // Default to false if there's an error
    }
  };

  // Function to check if email already exists
  const checkEmailExists = async (email) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/check-email/?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await response.json();
      return data.exists; // Assuming the API returns { exists: true/false }
    } catch (error) {
      console.error("Error checking email:", error);
      return false; // Default to false if there's an error
    }
  };

  // Handle username change with debounce
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    // Clear previous error
    setUsernameError("");

    // Only check if username is at least 3 characters
    if (value.length >= 3) {
      // Debounce the API call
      clearTimeout(window.usernameTimeout);
      window.usernameTimeout = setTimeout(async () => {
        const exists = await checkUsernameExists(value);
        if (exists) {
          setUsernameError("This username is already taken");
        }
      }, 500);
    }
  };

  // Handle email change with debounce
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Clear previous error
    setEmailError("");

    // Only check if email looks valid
    if (value.includes('@') && value.includes('.')) {
      // Debounce the API call
      clearTimeout(window.emailTimeout);
      window.emailTimeout = setTimeout(async () => {
        const exists = await checkEmailExists(value);
        if (exists) {
          setEmailError("This email is already registered");
        }
      }, 500);
    }
  };

  const handleSignUp = async () => {
    // Reset error messages
    setMessage("");

    // Validate all fields
    if (!firstName || !lastName || !username || !email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    // Check for validation errors
    if (usernameError || emailError) {
      setMessage(usernameError || emailError);
      return;
    }

    setIsLoading(true);

    try {
      // Final check for username and email duplicates before proceeding
      const [usernameExists, emailExists] = await Promise.all([
        checkUsernameExists(username),
        checkEmailExists(email)
      ]);

      if (usernameExists) {
        setUsernameError("This username is already taken");
        setMessage("This username is already taken");
        setIsLoading(false);
        return;
      }

      if (emailExists) {
        setEmailError("This email is already registered");
        setMessage("This email is already registered");
        setIsLoading(false);
        return;
      }

      // Proceed with Firebase signup
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendVerificationEmail(user);

      const tempUserData = {
        firstName: firstName,
        lastName: lastName,
        username: username,
        email,
        password,
        firebaseUid: user.uid
      };
      localStorage.setItem("tempUserData", JSON.stringify(tempUserData));
      setMessage("Verification email sent! Please check your inbox.");
      navigate("/verify-email");
    } catch (error) {
      console.error("Error:", error);

      // Handle Firebase specific errors
      if (error.code === 'auth/email-already-in-use') {
        setEmailError("This email is already registered");
        setMessage("This email is already registered");
      } else {
        setMessage(error.message || "An error occurred during sign up.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if email already exists in your database
      const emailExists = await checkEmailExists(user.email);

      if (emailExists) {
        // If email exists, just log them in
        localStorage.setItem("authToken", user.accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/");
      } else {
        // If new user, collect additional information
        const tempUserData = {
          firstName: user.displayName ? user.displayName.split(' ')[0] : '',
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
          email: user.email,
          firebaseUid: user.uid,
          // Generate a username from email
          username: user.email.split('@')[0]
        };

        localStorage.setItem("tempUserData", JSON.stringify(tempUserData));
        // You might want to redirect to a profile completion page
        navigate("/complete-profile");
      }
    } catch (error) {
      console.error("Google Sign-Up Error:", error);
      setMessage("Google Sign-Up Failed!");
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center">
        <div className="rounded-lg w-full h-full bg-opacity-50">
          <img
            className="w-full h-full object-cover"
            src="https://i.ibb.co/yF04zrC9/vecteezy-computer-electronic-chip-with-processor-transistors-29336852.jpg"
            alt="Computer Illustration"
          />
        </div>
      </div>

      <div className="w-1/2 bg-black text-[#F3F7F6] p-10 shadow-lg flex flex-col justify-center">
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
          Welcome! Please Sign Up to continue
        </p>

        <div className="flex flex-row w-full justify-between gap-4">
          <div className="w-1/2">
            <label className="mb-2 text-sm block" htmlFor="firstName">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mb-4 p-2 border border-gray-300 rounded w-full text-black"
              placeholder="Bruce"
            />
          </div>
          <div className="w-1/2">
            <label className="mb-2 text-sm block" htmlFor="lastName">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mb-4 p-2 border border-gray-300 rounded w-full text-black"
              placeholder="Wayne"
            />
          </div>
        </div>

        <label className="text-sm" htmlFor="username">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={handleUsernameChange}
          className={`mb-1 p-2 border ${usernameError ? 'border-red-500' : 'border-gray-300'} rounded w-full text-black`}
          placeholder="batman"
        />
        {usernameError && <p className="text-red-400 text-xs mb-3">{usernameError}</p>}
        {!usernameError && <div className="mb-3"></div>}

        <label className="text-sm" htmlFor="email">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          className={`mb-1 p-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded w-full text-black`}
          placeholder="wayne.enterprises@gotham.com"
        />
        {emailError && <p className="text-red-400 text-xs mb-3">{emailError}</p>}
        {!emailError && <div className="mb-3"></div>}

        <label className="text-sm" htmlFor="password">
          Password
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full pr-10 text-black"
            placeholder="********"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? (
              <IoMdEyeOff className="w-5 h-5" />
            ) : (
              <FaEye className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs mb-4">
          By signing up, you agree to our company's{" "}
          <a href="#" className="text-blue-500">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-500">
            Privacy Policy
          </a>
          .
        </p>

        {message && (
          <p className={`text-center text-sm mb-2 ${message.includes("sent") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            onClick={handleSignUp}
            className="w-[60%] bg-green-500 text-white px-4 py-2 rounded-3xl cursor-pointer hover:bg-transparent border hover:border-green-500 hover:text-green-500 transition duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Signing Up..." : "SIGN UP"}
          </button>
        </div>

        <p className="text-center my-1 text-white">OR</p>

        <div className="flex justify-center">
          <button
            onClick={handleGoogleSignUp}
            className="flex items-center justify-center w-[60%] p-3 bg-gray-200 text-black rounded-3xl hover:bg-gray-300 transition duration-200"
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            <span>Google</span>
          </button>
        </div>

        <div className="flex justify-center">
          <p className="mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/signin" className="text-blue-400 underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
