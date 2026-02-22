// src/pages/Cart.js
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContent";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

// ✅ Helper: Returns correct image URL (Cloudinary or local fallback)
const getImageUrl = (image) => {
  if (!image) return "https://via.placeholder.com/120?text=No+Image";
  if (image.startsWith("http")) return image; // Cloudinary URL
  return `http://localhost:5000/${image.replace(/^\/?/, "")}`; // Old local fallback
};

const Cart = () => {
  const {
    cartItems = [],
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    placeOrder,
    loading,
  } = useCart() || {};

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🛒 Current cart items:", cartItems);
    console.log("🛒 Cart items type:", typeof cartItems, Array.isArray(cartItems));
  }, [cartItems]);

  const calculateTotal = () => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((total, item) => {
      if (!item) return total;
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + price * quantity;
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!placeOrder) {
      alert("Place order function is not available");
      return;
    }

    setIsPlacingOrder(true);
    const result = await placeOrder();
    setIsPlacingOrder(false);

    if (result && result.success) {
      alert("Order placed successfully! Check your email for confirmation.");
      navigate("/");
    } else {
      alert(result?.message || "Failed to place order. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="cart-container">
        <h2>Loading your cart...</h2>
      </div>
    );
  }

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="cart-container">
        <h2>Your Cart</h2>
        <div className="empty-cart">
          <p>No items in the cart yet.</p>
          <button onClick={() => navigate("/")} className="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item, index) => {
            if (!item) {
              console.warn("⚠️ Undefined item at index:", index);
              return null;
            }

            if (!item._id) {
              console.warn("⚠️ Item without ID:", item);
              return null;
            }

            const itemId = item._id;
            const itemName = item.name || "Unknown Product";
            const itemPrice = Number(item.price) || 0;
            const itemQuantity = Number(item.quantity) || 1;
            const itemImage = item.image || "";
            const itemDescription = item.description || "";

            return (
              <div key={itemId} className="cart-item">
                <img
                  src={getImageUrl(itemImage)}
                  alt={itemName}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/120?text=No+Image";
                  }}
                />

                <div className="cart-details">
                  <h4>{itemName}</h4>
                  {itemDescription && (
                    <p className="item-description">{itemDescription}</p>
                  )}
                  <p className="item-price">Price: ₹{itemPrice}</p>

                  <div className="quantity-controls">
                    <button
                      onClick={() => decreaseQuantity && decreaseQuantity(itemId)}
                      disabled={isPlacingOrder || !decreaseQuantity}
                    >
                      -
                    </button>
                    <span className="quantity-display">{itemQuantity}</span>
                    <button
                      onClick={() => increaseQuantity && increaseQuantity(itemId)}
                      disabled={isPlacingOrder || !increaseQuantity}
                    >
                      +
                    </button>
                  </div>

                  <p className="item-total">
                    Total: ₹{(itemPrice * itemQuantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart && removeFromCart(itemId)}
                    className="remove-btn"
                    disabled={isPlacingOrder || !removeFromCart}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Items ({cartItems.length}):</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span>Grand Total:</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="place-order-btn"
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order"}
          </button>

          <button onClick={() => navigate("/")} className="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;