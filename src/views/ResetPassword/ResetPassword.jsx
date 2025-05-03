import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const oobCode = new URLSearchParams(location.search).get('oobCode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setMessage('Invalid password reset link');
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setUserEmail(email);
      } catch (error) {
        setMessage('Invalid or expired password reset link');
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (!userEmail) {
      setMessage('Could not determine your email address. Please try again.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);

      const response = await fetch('http://localhost:8000/api/update-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          new_password: newPassword,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update password in database');
      }

      setMessage('Password successfully reset! Redirecting to sign in page...');
      setTimeout(() => navigate('/signin'), 3000);
    } catch (error) {
      setMessage(error.message || 'An error occurred during password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Set New Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition ${
              isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>

          {message && (
            <p className="text-center text-sm mt-4 text-red-600">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
