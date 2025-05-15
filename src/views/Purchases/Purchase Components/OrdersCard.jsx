import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import OrderDetails from "./OrderDetails";

const OrderCard = ({
  status,
  subStatus,
  image,
  title,
  quantity,
  price,
  total,
  note,
  buttons = [],
  onStatusChange,
  cancelReason,
  id,
  products,
  paymentDetails,    // Add these props to receive payment and delivery info
  deliveryDetails
}) => {
  const navigate = useNavigate();
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    author: "",
    rating: 0,
    comment: "",
  });
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  const cancelReasons = [
    "I ordered by mistake",
    "Item won't arrive on time",
    "Found a better price elsewhere",
    "Change of mind",
    "Ordered wrong item",
    "Others",
  ];

  const orderTotal = products
    ? products.reduce(
        (sum, product) => sum + Number(product.total.replace(/,/g, "")),
        0
      )
    : 0;

  const handleReviewSubmit = () => {
    // Handle review submission logic here
    console.log("Review submitted:", newReview);
    setIsRatingOpen(false);
    setNewReview({ author: "", rating: 0, comment: "" });
  };

  const handleButtonClick = (buttonLabel) => {
    switch (buttonLabel) {
      case "Contact Store":
        navigate("/contactus");
        break;
      case "Buy Again":
        navigate("/products");
        break;
      case "Cancel Order":
        setIsCancelOpen(true);
        break;
      case "Rate":
        setIsRatingOpen(true);
        break;
      case "Order Received":
        // Update order status to Completed
        onStatusChange("Completed");
        setCurrentStatus("Completed");
        break;
      default:
        break;
    }
  };

  const renderAddressSection = () => {
    if (!deliveryDetails) return null;

    if (deliveryDetails.method === "Store Pickup") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
          <div>
            <h3 className="font-medium mb-2">Pickup Location</h3>
            <div className="text-sm text-gray-600">
              {deliveryDetails.pickupLocation ? (
                <>
                  <div><strong>Store:</strong> {deliveryDetails.pickupLocation.storeName}</div>
                  <div><strong>Address:</strong> {deliveryDetails.pickupLocation.address}</div>
                  <div><strong>Hours:</strong> {deliveryDetails.pickupLocation.hours}</div>
                </>
              ) : (
                <div>Please contact store for pickup details</div>
              )}
            </div>
          </div>

          {paymentDetails?.method === "Credit Card" && deliveryDetails.billing && (
            <div>
              <h3 className="font-medium mb-2">Billing Address</h3>
              <div className="text-sm text-gray-600">
                {deliveryDetails.billing}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-2">Payment Method</h3>
            <div className="text-sm text-gray-600">
              {paymentDetails?.method || "Cash on Delivery (COD)"}
            </div>

            <h3 className="font-medium mb-2 mt-4">Delivery Method</h3>
            <div className="text-sm text-gray-600">
              {deliveryDetails.method}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-4">
        {deliveryDetails.address && (
          <div>
            <h3 className="font-medium mb-2">Delivery Address</h3>
            <div className="text-sm text-gray-600">
              {deliveryDetails.address}
            </div>
          </div>
        )}

        {paymentDetails?.method === "Credit Card" && deliveryDetails.billing && (
          <div>
            <h3 className="font-medium mb-2">Billing Address</h3>
            <div className="text-sm text-gray-600">
              {deliveryDetails.billing}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-medium mb-2">Payment Method</h3>
          <div className="text-sm text-gray-600">
            {paymentDetails?.method || "Cash on Delivery (COD)"}
          </div>

          <h3 className="font-medium mb-2 mt-4">Delivery Method</h3>
          <div className="text-sm text-gray-600">
            {deliveryDetails.method}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border-b p-4 md:p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between text-xs mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className={currentStatus === "Cancelled" ? "text-red-600" : "text-green-600"}>
            {currentStatus.toUpperCase()}
          </div>

          {/* Divider */}
          <div className={`w-px h-3 ${currentStatus === "Cancelled" ? "bg-red-600" : "bg-green-600"}`} />

          <div className={currentStatus === "Cancelled" ? "text-red-600" : "text-green-600"}>
            {subStatus}
          </div>
        </div>        <Button
          onClick={() => setIsOrderDetailsOpen(true)}
          className="text-sm cursor-pointer bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
        >
          View Order Details
        </Button>
      </div>
      <hr className="my-4 border-t border-black" />

      {/* Product Details */}      {products.map((product, idx) => (
        <div
          key={idx}
          className="flex justify-between items-start gap-4 flex-1 mb-4 pb-4 border-b last:border-b-0"
        >
          <div className="flex items-start gap-4 flex-1">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name || product.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="font-medium text-base text-gray-900">
                {product.name || product.title}
              </h3>
              {(product.description || product.specs) && (
                <p className="text-sm text-gray-600 mt-1">
                  {product.description || Object.values(product.specs || {}).filter(Boolean).join(' • ')}
                </p>
              )}
              {product.variation && (
                <p className="text-sm text-gray-600 mt-1">
                  Variation: {product.variation}
                </p>
              )}
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-800">₱{parseFloat(product.price).toLocaleString()}</span>
                <span className="text-sm text-gray-500 mx-2">×</span>
                <span className="text-sm text-gray-800">{product.quantity}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-green-600 font-semibold">
              ₱{(parseFloat(product.price) * product.quantity).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Subtotal
            </div>
          </div>
        </div>
      ))}

      <hr className="my-4 border-t border-black" />

      {/* Total */}
      <div className="flex justify-between items-center text-sm mb-3">
        {/* Optional Note or Cancelation Reason */}
        {currentStatus === "Cancelled" && cancelReason ? (
          <p className="text-xs text-gray-500 text-right">
            Cancelation Reason: {cancelReason}
          </p>
        ) : currentStatus !== "Completed" && note ? (
          <div className="text-xs text-gray-500 mb-2">{note}</div>
        ) : (
          <div></div>
        )}
        <div className="ml-auto">
          <span className="mr-2">Order Total:</span>
          <span className="text-green-600 font-semibold">
            ₱{orderTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {buttons.map((label, index) => (
          <Button
            key={index}
            variant="outline"
            className="text-sm cursor-pointer hover:bg-green-500 hover:text-white"
            onClick={() => handleButtonClick(label)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-baseline gap-2">
                  <div className="text-sm text-gray-600">Order ID:</div>
                  <DialogTitle className="text-xl font-semibold">{id}</DialogTitle>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Order Placed: May 03, 2025
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${currentStatus === "Cancelled" ? "text-red-600" : "text-green-600"}`}>
                  {currentStatus.toUpperCase()}
                </div>
                {subStatus && (
                  <div className={`text-xs mt-1 ${currentStatus === "Cancelled" ? "text-red-500" : "text-green-500"}`}>
                    {subStatus}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-6">
              {/* Products */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Products</h3>
                <div className="space-y-4">
                  {products.map((product, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name || product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 justify-between">
                        <div>
                          <h3 className="font-medium">{product.name || product.title}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            Quantity: {product.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₱{parseFloat(product.price).toLocaleString()}</div>
                          <div className="text-sm text-gray-600">
                            Subtotal: ₱{(parseFloat(product.price) * product.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₱{orderTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping Fee</span>
                    <span>₱0</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg pt-2 border-t">
                    <span>Order Total</span>
                    <span className="text-green-600">₱{orderTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Addresses and Payment */}
              {renderAddressSection()}
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white" 
              onClick={() => setIsOrderDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Your name"
              value={newReview.author}
              onChange={(e) =>
                setNewReview({ ...newReview, author: e.target.value })
              }
            />

            <div>
              <p className="mb-1">Rating</p>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`cursor-pointer text-2xl ${
                      star <= newReview.rating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="What did you like or dislike?"
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleReviewSubmit}
              className="cursor-pointer hover:bg-green-500 hover:text-white"
            >
              Post Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Cancellation Reason</DialogTitle>
          </DialogHeader>
          <hr className="my-4 border-t border-black" />
          <RadioGroup
            value={selectedCancelReason}
            onValueChange={setSelectedCancelReason}
            className="space-y-2"
          >
            {cancelReasons.map((reason, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem id={`cancel-reason-${idx}`} value={reason} />
                <label
                  htmlFor={`cancel-reason-${idx}`}
                  className="text-sm cursor-pointer"
                >
                  {reason}
                </label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelOpen(false);
                setSelectedCancelReason("");
              }}
              className="cursor-pointer"
            >
              Not Now
            </Button>
            <Button
              onClick={() => {
                // Change order status to Cancelled and store reason
                onStatusChange("Cancelled", selectedCancelReason);
                setCurrentStatus("Cancelled");
                setIsCancelOpen(false);
                setSelectedCancelReason("");
              }}
              disabled={!selectedCancelReason}
              className="bg-red-500 text-white hover:bg-red-600 cursor-pointer"
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderCard;