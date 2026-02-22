// src/pages/OrderHistory.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderHistory.css";

// ✅ Helper: Returns correct image URL (Cloudinary or local fallback)
const getImageUrl = (image) => {
  if (!image) return "https://via.placeholder.com/80?text=No+Image";
  if (image.startsWith("http")) return image; // Cloudinary URL
  return `https://shoppy-backend-4clp.onrender.com/${image.replace(/^\/?/, "")}`; // Old local fallback
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios
      .get("/api/orders/my-orders", { withCredentials: true })
      .then((res) => setOrders(res.data.orders))
      .catch((err) => console.error("❌ Order fetch error:", err));
  }, []);

  return (
    <div className="order-history">
      <h2>📦 Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="order-card">
            <p><strong>Ordered On:</strong> {new Date(order.orderedAt).toLocaleString()}</p>
            <p><strong>Total:</strong> ₹{order.totalAmount}</p>
            <div className="order-items">
              {order.products.map(({ productId, quantity }) => (
                <div key={productId._id} className="order-item">
                  <img
                    src={getImageUrl(productId.image)}
                    alt={productId.name}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80?text=No+Image";
                    }}
                  />
                  <div>
                    <h4>{productId.name}</h4>
                    <p>Qty: {quantity}</p>
                    <p>Price: ₹{productId.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistory;
