import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/views/Cart/Cart Components/CartContext";

const OrderSum = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const details = localStorage.getItem('orderDetails');
    if (!details) {
      navigate('/cart');
      return;
    }
    setOrderDetails(JSON.parse(details));
  }, [navigate]);  if (!orderDetails) return null;
  const subtotal = orderDetails?.subtotal || 0;
  const shippingFee = 0;
  const discount = 0;
  const total = subtotal - discount + shippingFee;

  return (
    <div className="p-5 border rounded-lg shadow-lg w-full bg-white">
      <div className="flex justify-between">
        <h2 className="text-lg font-bold mb-2">Order Summary</h2>
        <p className="text-sm text-gray-600 mb-4">
          Order ID: #EGIE-
          {Math.random().toString(36).substring(2, 8).toUpperCase()}
        </p>
      </div>

      {orderDetails?.orderNote && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Order Note</h3>
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{orderDetails.orderNote}</p>
        </div>
      )}

      <p className="text-sm text-red-500 mt-4 bg-red-100 p-2 rounded-md border border-red-500">
        Currently, refunds are not supported. Please review your order carefully
        before purchase.
      </p>

      <hr className="my-4 stroke-black" />

      <div className="space-y-4 mb-6">
        {orderDetails?.items.map((item, index) => (
          <div key={index} className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="h-24 w-24 bg-amber-400 rounded mr-4 overflow-hidden flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-base">{item.name}</h3>
                <p className="text-base font-semibold text-green-600">
                  ₱{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                {item.variation && (
                  <p>Variation: {item.variation}</p>
                )}
                {item.monitorSize && (
                  <p>Monitor Size: {item.monitorSize}</p>
                )}
                {item.specs && (
                  <div className="mt-2">
                    <p>Specifications:</p>
                    <ul className="list-disc list-inside pl-2">
                      {item.specs.processor && <li>Processor: {item.specs.processor}</li>}
                      {item.specs.ram && <li>RAM: {item.specs.ram}</li>}
                      {item.specs.storage && <li>Storage: {item.specs.storage}</li>}
                      {item.specs.graphics && <li>Graphics: {item.specs.graphics}</li>}
                    </ul>
                  </div>
                )}
                <p className="mt-2">Quantity: {item.quantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="my-4" />      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₱{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span>-₱{discount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping ({orderDetails?.deliveryMethod})</span>
          <span>₱{shippingFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-base mt-2 border-t pt-2">
          <span>Total</span>
          <span>₱{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSum;
