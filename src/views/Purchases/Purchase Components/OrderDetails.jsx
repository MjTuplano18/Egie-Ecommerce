import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import purchaseData from "../../Data/purchaseData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const OrderDetails = () => {
  const { id } = useParams();
  const order = purchaseData.find((order) => order.id === Number(id));

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const cancelReasons = [
    "I ordered by mistake",
    "Item won't arrive on time",
    "Found a better price elsewhere",
    "Change of mind",
    "Ordered wrong item",
    "Others",
  ];

  if (!order) {
    return <div className="p-6">Order not found.</div>;
  }

  return (    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Order Header */}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="text-sm text-gray-600">
                Order ID: {id}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Order Placed</div>
                <div className="font-medium">May 03, 2025</div>
              </div>
            </div>
          </div>

          <hr />

          {/* Product List */}
          <div className="p-6">
            {order.products.map((product, idx) => (
              <div key={idx} className="flex items-start gap-6 mb-6 last:mb-0">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0"></div>
                <div className="flex-grow">
                  <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
                  <p className="text-sm text-gray-500">Product details here</p>
                  <div className="mt-2">x {product.quantity}</div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">Price: ₱{product.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 border-y">
            <div className="text-right">
              <span className="text-lg font-semibold mr-2">Order Total:</span>
              <span className="text-xl font-bold text-green-600">
                ₱{order.products.reduce((sum, product) => 
                  sum + (Number(product.total.replace(/,/g, ""))), 
                  0
                ).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Delivery Address */}
            <div>
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <div className="text-sm text-gray-600">
                <div><strong>Name:</strong> Mik ko</div>
                <div><strong>Phone:</strong> (+63) 9184549421</div>
                <div>
                  <strong>Address:</strong> Blk 69 LOT 96, Dyan Lang Sa Gedli Ng Kanto, 
                  Poblacion, Santa Maria, North Luzon, Bulacan 3022
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h3 className="font-semibold mb-2">Billing Address</h3>
              <div className="text-sm text-gray-600">
                <div><strong>Name:</strong> Mik ko</div>
                <div><strong>Phone:</strong> (+63) 9184549421</div>
                <div>
                  <strong>Address:</strong> Blk 69 LOT 96, Dyan Lang Sa Gedli Ng Kanto, 
                  Poblacion, Santa Maria, North Luzon, Bulacan 3022
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <div className="text-sm text-gray-600 mb-4">Cash on Delivery (COD)</div>
              
              <h3 className="font-semibold mb-2">Delivery Method</h3>
              <div className="text-sm text-gray-600">Standard Shipping</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t p-6 flex justify-end gap-4">
            <Button
              onClick={() => setIsCancelOpen(true)}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
            >
              Cancel order
            </Button>
            <Link to="/products">
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                Continue shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Cancellation Reason</DialogTitle>
          </DialogHeader>
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
            >
              Not Now
            </Button>
            <Button
              onClick={() => {
                setIsCancelOpen(false);
                setSelectedCancelReason("");
              }}
              disabled={!selectedCancelReason}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetails;