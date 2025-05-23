import React from 'react';
import {BrowserRouter as Router, Routes, Route, useLocation} from 'react-router-dom'
import Navbar from './views/Components/Navbar/Navbar'
import SignUp from './views/SignUp/SignUp'
import Landing from './views/Landing/Landing'
import SignIn from './views/SignIn/SignIn'
import Footer from './views/Components/Footer/Footer'
import Products from './views/Products/Products'
import ProductDetails from './views/Products/ProductGrid/ProductDetails/ProductDetails';
import Cart from './views/Cart/Cart';
import Checkout from './views/Checkout/Checkout';
import ThankYou from './views/Checkout/Thankyou';
import VerifyEmail from "./views/VerifyEmail/VerifyEmail";
import ForgotPassword from "./views/ForgotPassword/ForgotPassword";
import ResetPassword from "./views/ResetPassword/ResetPassword";
import ProfileSettings from './views/Profile/ProfileSettings';
import Settings from './views/Settings/Settings';
import ScrollToTop from './views/Components/ScrollToTop/ScrollToTop';
import SystemBuild from './views/SystemBuild/SystemBuild';
import ContactUs from './views/ContactUs/ContactUs';
import Notification from './views/Notifications/Notification';
import Purchases from './views/Purchases/Purchases';
import OrderDetails from './views/Purchases/Purchase Components/OrderDetails';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from "sonner";

// Layout wrapper component
const PageLayout = ({ children, isAuthPage }) => {
  return (
    <div className={`min-h-screen ${isAuthPage ? "" : "pt-[80px]"}`}>
      {children}
    </div>
  );
};

function App() {
  return (
    <CartProvider>
      <Router>
        <Main />
      </Router>
    </CartProvider>
  )
}

// Separate component so we can access route info
const Main = () => {
  const location = useLocation();

  // Detect if current route is sign-in/sign-up page
  const isAuthPage = location.pathname === "/auth" ||
                    location.pathname === "/signin" ||
                    location.pathname === "/verify-email-success";

  return (
    <>
      <Navbar isAuth={isAuthPage} />
      <ScrollToTop />
      <PageLayout isAuthPage={isAuthPage}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/details/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thankyou" element={<ThankYou />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile/settings" element={<ProfileSettings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/buildpc" element={<SystemBuild />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/details/:id" element={<OrderDetails />} />
        </Routes>
      </PageLayout>
      <Footer isAuth={isAuthPage} />
      <Toaster richColors position="bottom-right" />
    </>
  );
};

export default App