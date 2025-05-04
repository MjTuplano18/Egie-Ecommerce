// src/views/ForgotPassword/ForgotPassword.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!email) {
      setMessage("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/request-password-reset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage("A verification code has been sent to your email address.");
      } else {
        setMessage(data.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      setMessage("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Reset Your Password</h2>

        {isSuccess ? (
          <div className="text-center">
            <div className="mb-4 text-green-600">{message}</div>
            <p className="mb-4">Please check your email for the verification code.</p>
            <Link
              to="/reset-password"
              className="block w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 text-center"
            >
              Enter Verification Code
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your email"
              />
            </div>

            {message && (
              <div className="mb-4 text-red-500 text-sm">{message}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200"
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>

            <div className="mt-4 text-center">
              <Link to="/signin" className="text-green-500 hover:text-green-700">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
