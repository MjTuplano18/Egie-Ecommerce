import React, { useState, useEffect } from "react";
import OrderTabs from "./Purchase Components/OrderTabs";
import OrderCard from "./Purchase Components/OrdersCard";
import { orderService } from "../../services/api";
import { toast } from "sonner";

const Purchases = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load orders when component mounts
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let ordersData = await orderService.getOrders();

        // Format orders to include all necessary data
        ordersData = ordersData.map(order => ({
          ...order,
          orderId: order.orderId,
          orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
          products: order.items || order.products || [],
          status: order.status || 'To Ship',
          subStatus: order.subStatus || 'Processing',
          paymentDetails: order.paymentDetails || {
            method: order.paymentMethod,
            status: 'Paid',
            total: order.total
          },
          deliveryDetails: order.deliveryDetails || {
            method: order.deliveryMethod,
            address: order.shippingAddress,
            billing: order.billingAddress,
            pickupLocation: order.pickupLocation
          },
          total: order.total || order.items?.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) || 0
        }));

        setOrders(ordersData);
        console.log('Loaded orders:', ordersData);
      } catch (error) {
        console.error('Error loading orders:', error);
        setError('Failed to load orders. Please try refreshing the page.');
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus, reason = "") => {
    try {
      // First update the orders state immediately for instant UI feedback
      setOrders(prevOrders => prevOrders.map(order => {
        if (order.orderId === orderId) {
          return {
            ...order,
            status: newStatus,
            subStatus: newStatus === 'Completed' ? 'Order Completed'
                      : newStatus === 'Cancelled' ? 'Cancelled by you'
                      : order.subStatus,
            cancelReason: newStatus === 'Cancelled' ? reason : order.cancelReason,
            updatedAt: new Date().toISOString()
          };
        }
        return order;
      }));

      // Then update in the backend
      await orderService.updateOrderStatus(orderId, newStatus, reason);

      toast.success(
        newStatus === 'Cancelled'
          ? 'Order cancelled successfully'
          : newStatus === 'Completed'
          ? 'Order marked as completed'
          : 'Order status updated'
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      
      // Revert the orders state if the backend update fails
      const currentOrders = await orderService.getOrders();
      setOrders(currentOrders);
      
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = activeTab === "All"
    ? orders
    : orders.filter((order) => order.status === activeTab);

  const getButtons = (status) => {
    switch (status) {
      case "To Ship":
        return ["Contact Store", "Cancel Order"];
      case "Completed":
        return ["Contact Store", "Rate", "Buy Again"];
      case "Cancelled":
        return ["Contact Store", "Buy Again"];
      case "Store Pick-up":
        return ["Contact Store", "Buy Again"];
      case "To Receive":
        return ["Contact Store", "Order Received"];
      default:
        return [];
    }
  };

  const orderTotal = orders.reduce((sum, order) => {
    const orderValue = parseFloat(order.total || 0);
    if (isNaN(orderValue)) {
      const productTotal = order.products?.reduce(
        (productSum, product) => productSum + (parseFloat(product.price || 0) * (product.quantity || 1)),
        0
      ) || 0;
      return sum + productTotal;
    }
    return sum + orderValue;
  }, 0);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen py-6">
        <OrderTabs activeTab={activeTab} onChange={setActiveTab} />
        <div className="animate-pulse px-4 md:px-10 mt-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen py-6">
        <OrderTabs activeTab={activeTab} onChange={setActiveTab} />
        <div className="mt-6 px-4 md:px-10">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm bg-red-100 px-3 py-1 rounded-md hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-6">
      <OrderTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="mt-6 space-y-6 px-4 md:px-10">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              {...order}
              buttons={getButtons(order.status)}
              onStatusChange={(newStatus, reason) =>
                handleStatusChange(order.orderId, newStatus, reason)
              }
              cancelReason={order.cancelReason}
              paymentDetails={order.paymentDetails}
              deliveryDetails={order.deliveryDetails}
            />
          ))
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No orders found in this category</p>
            <a
              href="/products"
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Shopping
            </a>
          </div>
        )}
      </div>

    </div>
  );
};

export default Purchases;
