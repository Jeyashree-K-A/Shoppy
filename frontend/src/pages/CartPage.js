// src/pages/CartPage.js - Alternative version (Fixed)
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCart } from "../context/CartContent";
import { useAuth } from "../context/AuthContext";
import "./CartPage.css";

// ✅ Helper: Returns correct image URL (Cloudinary or local fallback)
const getImageUrl = (image) => {
  if (!image) return "https://via.placeholder.com/120?text=No+Image";
  if (image.startsWith("http")) return image; // Cloudinary URL
  return `https://shoppy-backend-4clp.onrender.com/${image.replace(/^\/?/, "")}`; // Old local fallback
};

const CartPage = () => {
  const { user } = useAuth();
  const { cartItems, setCartItems, fetchCart } = useCart();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = (productId, newQty) => {
    if (newQty < 1) return;
    axios
      .put(
        "/api/cart/update",
        { productId, quantity: newQty },
        { withCredentials: true }
      )
      .then(() => fetchCart())
      .catch((err) => console.error("Update error:", err));
  };

  const removeItem = (productId) => {
    axios
      .delete(`/api/cart/remove/${productId}`, {
        withCredentials: true,
      })
      .then(() => fetchCart())
      .catch((err) => console.error("Remove error:", err));
  };

  const placeOrder = () => {
    setLoading(true);

    axios
      .post("/api/cart/place-order", {}, { withCredentials: true })
      .then(() => {
        setCartItems([]);
        alert("✅ Order placed successfully!");
      })
      .catch(() => {
        alert("❌ Something went wrong. Try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getTotal = () =>
    cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>

      {loading && (
        <div className="loading-msg">⏳ Placing your order, please wait...</div>
      )}

      {!loading && (
        <>
          {cartItems.length === 0 ? (
            <p>Cart is empty 😕</p>
          ) : (
            <>
              {cartItems.map((item) => {
                if (!item || !item._id) {
                  console.warn("⚠️ Invalid item:", item);
                  return null;
                }

                const itemId = item._id;
                const itemName = item.name || "Unknown Product";
                const itemPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 1;
                const itemImage = item.image || "";

                return (
                  <div key={itemId} className="cart-item">
                    <img
                      src={getImageUrl(itemImage)}
                      alt={itemName}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/120?text=No+Image";
                      }}
                    />
                    <div>
                      <h4>{itemName}</h4>
                      <p>₹{itemPrice} × {itemQuantity}</p>
                      <div className="qty-controls">
                        <button onClick={() => updateQuantity(itemId, itemQuantity - 1)}>
                          -
                        </button>
                        <span>{itemQuantity}</span>
                        <button onClick={() => updateQuantity(itemId, itemQuantity + 1)}>
                          +
                        </button>
                      </div>
                      <button onClick={() => removeItem(itemId)}>Remove</button>
                    </div>
                  </div>
                );
              })}
              <h3>Total: ₹{getTotal().toFixed(2)}</h3>
              <button onClick={placeOrder} className="place-order-btn" disabled={loading}>
                📦 Place Order
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CartPage;
