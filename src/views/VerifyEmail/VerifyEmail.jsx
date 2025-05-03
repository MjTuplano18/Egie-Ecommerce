import React, { useEffect, useState } from 'react';
import { auth } from "../../firebase";
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerification = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          await user.reload();

          if (user.emailVerified) {
            const tempUserData = JSON.parse(localStorage.getItem('tempUserData'));

            if (tempUserData) {
              try {
                const response = await fetch("http://127.0.0.1:8000/api/signup/", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    firstName: tempUserData.firstName,
                    lastName: tempUserData.lastName,
                    username: tempUserData.username,
                    email: tempUserData.email,
                    password: tempUserData.password,
                    firebaseUid: tempUserData.firebaseUid
                  }),
                  credentials: "include",
                });

                if (response.ok) {
                  localStorage.removeItem('tempUserData');
                  setVerificationStatus('success');
                  setTimeout(() => navigate('/signin'), 3000);
                }
              } catch (error) {
                console.error('Error saving user data:', error);
                setVerificationStatus('error');
              }
            }
          }
        }
      });

      return () => unsubscribe();
    };

    checkVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        {verificationStatus === 'pending' && (
          <>
            <Loader2 className="mx-auto animate-spin text-blue-500" size={40} />
            <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
            <p className="text-gray-600">
              Please check your inbox and click the verification link.
              You will be redirected to the login page once verified.
            </p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <CheckCircle className="mx-auto text-green-500" size={40} />
            <h2 className="text-2xl font-bold text-green-700">Email Verified!</h2>
            <p className="text-gray-600">Redirecting you to the login page...</p>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <AlertTriangle className="mx-auto text-red-500" size={40} />
            <h2 className="text-2xl font-bold text-red-600">Verification Error</h2>
            <p className="text-gray-600">Something went wrong. Please try again later.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
