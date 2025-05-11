import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  applyActionCode
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyA2EFH7dtZzR1gdIOv3Onf5vSmplv_2Vqg",
    authDomain: "fb-and--authentication.firebaseapp.com",
    projectId: "fb-and--authentication",
    storageBucket: "fb-and--authentication.appspot.com",
    messagingSenderId: "324713614550",
    appId: "1:324713614550:web:edb5648f76951ff249cd77",
    measurementId: "G-F6DBPV9LCS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure email verification settings
auth.useDeviceLanguage(); // Use the browser's language for sending verification emails

// Configure action code settings for email verification
export const actionCodeSettings = {
  // URL you want to redirect back to after email verification
  url: window.location.origin + '/verify-email-success',
  // This must be true for email verification
  handleCodeInApp: true,
};

// Configure Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account' // Force account selection even if one account is available
});

// Configure Facebook provider
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
    'display': 'popup' // Display as popup
});

// Helper function to create a user with email and password
export const registerWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Helper function to send verification email
export const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user, actionCodeSettings);
    return true;
  } catch (error) {
    throw error;
  }
};

// Helper function to sign in with email and password
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Helper function to apply verification code
export const verifyEmail = async (actionCode) => {
  try {
    await applyActionCode(auth, actionCode);
    return true;
  } catch (error) {
    throw error;
  }
};

export default app;