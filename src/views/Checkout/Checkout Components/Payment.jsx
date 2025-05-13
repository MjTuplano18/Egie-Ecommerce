import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCcVisa } from "react-icons/fa";
import { RiMastercardFill } from "react-icons/ri";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { userService, orderService } from "@/services/api";

const Payment = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [processing, setProcessing] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Check for order details
      const details = localStorage.getItem('orderDetails');
      if (!details) {
        navigate('/cart');
        return;
      }
      setOrderDetails(JSON.parse(details));

      // Check for delivery address
      try {
        const addressData = await userService.getAddress();
        setHasAddress(!!addressData && !!addressData.address_line);
      } catch (error) {
        console.error("Error checking address:", error);
        setHasAddress(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleProcessPayment = async () => {
    if (processing) return;

    if (!selectedPayment) {
      toast.error("Select payment method", {
        description: "Please select a payment method to continue."
      });
      return;
    }

    if (!hasAddress) {
      toast.error("No delivery address", {
        description: "Please add a delivery address in your profile settings."
      });
      return;
    }

    if (!orderDetails) {
      toast.error("Order error", {
        description: "There was an error with your order. Please try again."
      });
      navigate('/cart');
      return;
    }

    setProcessing(true);
    try {
      // Get delivery address
      const addressData = await userService.getAddress();
      const fullAddress = addressData ? 
        `${addressData.address_line}, ${addressData.city}, ${addressData.province}, ${addressData.postal_code}, ${addressData.country}` 
        : '';

      // Create new order using orderService
      await orderService.addOrder({
        items: orderDetails.items.map(item => ({
          ...item,
          price: parseFloat(item.price),
          total: (item.quantity * parseFloat(item.price)).toFixed(2)
        })),
        total: orderDetails.total,
        paymentMethod: selectedPayment,
        deliveryMethod: orderDetails.deliveryMethod === 'pickup' ? 'Store Pickup' : 'Standard Delivery',
        status: orderDetails.deliveryMethod === 'pickup' ? 'Store Pick-up' : 'To Ship',
        subStatus: orderDetails.deliveryMethod === 'pickup' ? 'Waiting for your arrival' : 'Processing',
        shippingAddress: fullAddress,
        billingAddress: fullAddress,
        note: orderDetails.orderNote || (orderDetails.deliveryMethod === 'pickup' ? 'Please come to the store to pick up your order.' : '')
      });

      // Clear cart and order details
      clearCart();
      localStorage.removeItem('orderDetails');

      toast.success('Order placed successfully!', {
        description: 'You can track your order in the Purchases section'
      });

      // Navigate to thank you page
      navigate('/thankyou');
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error("Payment failed", {
        description: error.message || "There was an error processing your payment. Please try again."
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-5 border rounded-lg shadow-md w-full max-w-2xl bg-white">
      <h2 className="text-xl font-bold mb-2">Payment Method</h2>
      <p className="text-gray-600 mb-4">
        All transactions are secure and encrypted
      </p>

      {!hasAddress && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Please add a delivery address in your profile settings before proceeding with payment.
        </div>
      )}

      <div className="mb-4 space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={selectedPayment === "cod"}
            onChange={() => setSelectedPayment("cod")}
            className="w-4 h-4 accent-green-500"
            disabled={processing || !hasAddress}
          />
          <span className="font-medium">Cash on Delivery (COD)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="gcash"
            checked={selectedPayment === "gcash"}
            onChange={() => setSelectedPayment("gcash")}
            className="w-4 h-4 accent-green-500"
            disabled={processing || !hasAddress}
          />
          <span className="font-medium">GCash</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="card"
            checked={selectedPayment === "card"}
            onChange={() => setSelectedPayment("card")}
            className="w-4 h-4 accent-green-500"
            disabled={processing || !hasAddress}
          />
          <span className="font-medium">Credit/Debit Card</span>
        </label>
      </div>

      {selectedPayment === "card" && (
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Card Number"
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={processing || !hasAddress}
          />
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="MM/YY"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              disabled={processing || !hasAddress}
            />
            <input
              type="text"
              placeholder="CVV"
              className="w-1/2 p-2 border border-gray-300 rounded-md"
              disabled={processing || !hasAddress}
            />
          </div>
          <input
            type="text"
            placeholder="Name on Card"
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={processing || !hasAddress}
          />
        </div>
      )}
      
      <div className="flex space-x-2 mb-4">
        <FaCcVisa size={22} />
        <RiMastercardFill size={22} />
      </div>

      <button
        onClick={handleProcessPayment}
        disabled={processing || !hasAddress}
        className={`w-full py-2 rounded-lg text-white text-center transition-colors ${
          processing || !hasAddress
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {processing ? 'Processing...' : 'Place Order'}
      </button>
    </div>
  );
};

export default Payment;
