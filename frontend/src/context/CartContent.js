// src/context/CartContent.js
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user, loading } = useAuth();

  // ✅ Fetch cart items from backend
  const fetchCart = async () => {
    if (!user) return;
    
    try {
      const res = await axios.get("/api/cart", {
        withCredentials: true,
      });
      
      //console.log("🔍 Raw cart data from backend:", res.data);
      
      // ✅ Transform backend data structure to frontend format with safety checks
      const transformedItems = (res.data.items || [])
        .filter(item => item && item.productId) // Filter out invalid items
        .map(item => {
          // Safety check for productId
          if (!item.productId || typeof item.productId !== 'object') {
            console.warn("⚠️ Invalid item structure:", item);
            return null;
          }

          return {
            _id: item.productId._id || item.productId,
            name: item.productId.name || "Unknown Product",
            price: item.productId.price || 0,
            image: item.productId.image || "",
            description: item.productId.description || "",
            category: item.productId.category || "",
            quantity: item.quantity || 1,
          };
        })
        .filter(Boolean); // Remove null entries
      
      setCartItems(transformedItems);
      //console.log("✅ Cart items transformed:", transformedItems);
    } catch (err) {
      console.error("❌ Fetch cart failed:", err.response?.data || err.message);
      setCartItems([]); // Reset on error
    }
  };

  // ✅ Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert("Please login to add items to cart");
      return { success: false, message: "Not authenticated" };
    }

    try {
      const res = await axios.post(
        "/api/cart/add",
        { productId, quantity },
        { withCredentials: true }
      );
      
      //console.log("✅ Add to cart response:", res.data);
      
      // ✅ Refresh cart to get updated data
      await fetchCart();
      return { success: true, message: res.data.message || "Added to cart" };
    } catch (err) {
      console.error("❌ Add to cart error:", err.response?.data || err.message);
      return { 
        success: false, 
        message: err.response?.data?.message || "Failed to add to cart" 
      };
    }
  };

  // ✅ Increase quantity
  const increaseQuantity = async (productId) => {
    if (!user) return;

    // Get current item to calculate new quantity
    const currentItem = cartItems.find(item => item._id === productId);
    if (!currentItem) {
      console.warn("⚠️ Item not found in cart:", productId);
      return;
    }

    try {
      const res = await axios.put(
        "/api/cart/update",
        { productId, quantity: currentItem.quantity + 1 },
        { withCredentials: true }
      );
      
      console.log("✅ Quantity increased:", res.data);
      await fetchCart();
    } catch (err) {
      console.error("❌ Increase failed:", err.response?.data || err.message);
      // Revert on error
      await fetchCart();
    }
  };

  // ✅ Decrease quantity
  const decreaseQuantity = async (productId) => {
    if (!user) return;

    const currentItem = cartItems.find(item => item._id === productId);
    if (!currentItem) {
      console.warn("⚠️ Item not found in cart:", productId);
      return;
    }

    // If quantity is 1, remove the item instead
    if (currentItem.quantity <= 1) {
      await removeFromCart(productId);
      return;
    }

    try {
      const res = await axios.put(
        "/api/cart/update",
        { productId, quantity: currentItem.quantity - 1 },
        { withCredentials: true }
      );
      
      console.log("✅ Quantity decreased:", res.data);
      await fetchCart();
    } catch (err) {
      console.error("❌ Decrease failed:", err.response?.data || err.message);
      // Revert on error
      await fetchCart();
    }
  };

  // ✅ Remove item from cart
  const removeFromCart = async (productId) => {
    if (!user) return;

    try {
      const res = await axios.delete(`/api/cart/remove/${productId}`, {
        withCredentials: true,
      });
      
      console.log("✅ Item removed:", res.data);
      await fetchCart();
    } catch (err) {
      console.error("❌ Remove failed:", err.response?.data || err.message);
      // Revert on error
      await fetchCart();
    }
  };

  // ✅ Clear entire cart
  const clearCart = async () => {
    if (!user) return;

    try {
      const res = await axios.post(
        "/api/cart/clear",
        {},
        { withCredentials: true }
      );
      
      setCartItems([]);
      console.log("✅ Cart cleared:", res.data);
    } catch (err) {
      console.error("❌ Clear failed:", err.response?.data || err.message);
    }
  };

  // ✅ Place order
  const placeOrder = async () => {
    if (!user) {
      alert("Please login to place order");
      return { success: false, message: "Not authenticated" };
    }

    if (cartItems.length === 0) {
      return { success: false, message: "Cart is empty" };
    }

    try {
      const res = await axios.post(
        "/api/cart/place-order",
        {},
        { withCredentials: true }
      );
      
      setCartItems([]);
      console.log("✅ Order placed:", res.data);
      return { success: true, message: res.data.message || "Order placed successfully" };
    } catch (err) {
      console.error("❌ Place order failed:", err.response?.data || err.message);
      return { 
        success: false, 
        message: err.response?.data?.message || "Failed to place order" 
      };
    }
  };

  // ✅ Fetch cart only AFTER auth is loaded and user is present
  useEffect(() => {
    if (!loading && user) {
      //console.log("📦 Fetching cart for user:", user.email || user.name);
      fetchCart();
    } else if (!loading && !user) {
      // Clear cart when user logs out
      console.log("🚪 User logged out, clearing cart");
      setCartItems([]);
    }
  }, [user, loading]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        fetchCart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};