const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const Order = require("../models/Order");
const auth = require("../middleware/authMiddleware");
const sendEmail = require("../utils/mailer");

// ✅ Get cart items
router.get("/", auth, async (req, res) => {
  try {
    //console.log("📦 Fetching cart for user:", req.user._id);
    
    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");
    
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    
    res.status(200).json({ items: cart.items || [] });
  } catch (err) {
    console.error("❌ Fetch cart error:", err);
    res.status(500).json({ message: "Server error while fetching cart" });
  }
});

// ✅ Add or increment item
router.post("/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    console.log("🛒 Adding to cart - UserId:", userId, "ProductId:", productId);

    // Validation
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      //console.log("📝 Creating new cart for user:", userId);
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId.toString());

    if (existingItem) {
      //console.log("➕ Incrementing quantity for existing item");
      existingItem.quantity += parseInt(quantity);
    } else {
      //console.log("✨ Adding new item to cart");
      cart.items.push({ productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    await cart.populate("items.productId");

    console.log("✅ Cart updated successfully");
    res.status(200).json({ 
      message: "Item added to cart", 
      items: cart.items,
      cartId: cart._id
    });
  } catch (err) {
    console.error("❌ Add to cart error:", err);
    res.status(500).json({ 
      message: "Server error while adding to cart",
      error: err.message 
    });
  }
});

// ✅ Update item quantity
router.put("/update", auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    console.log("🔄 Updating cart - ProductId:", productId, "Quantity:", quantity);

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "Product ID and quantity are required" });
    }

    if (quantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(i => i.productId.toString() === productId.toString());
    
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove item if quantity is 0
    if (quantity === 0) {
      cart.items = cart.items.filter(i => i.productId.toString() !== productId.toString());
    } else {
      item.quantity = parseInt(quantity);
    }

    await cart.save();
    await cart.populate("items.productId");

    //console.log("✅ Cart updated successfully");
    res.status(200).json({ items: cart.items });
  } catch (err) {
    console.error("❌ Update quantity error:", err);
    res.status(500).json({ 
      message: "Server error while updating quantity",
      error: err.message 
    });
  }
});

// ✅ Decrease item quantity
router.post("/decrease", auth, async (req, res) => {
  try {
    const { productId } = req.body;

    //console.log("➖ Decreasing quantity - ProductId:", productId);

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(i => i.productId.toString() === productId.toString());

    if (item) {
      item.quantity -= 1;
      
      if (item.quantity <= 0) {
        console.log("🗑️ Removing item (quantity reached 0)");
        cart.items = cart.items.filter(i => i.productId.toString() !== productId.toString());
      }
      
      await cart.save();
    } else {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.populate("items.productId");
    
    console.log("✅ Quantity decreased successfully");
    res.status(200).json({ items: cart.items });
  } catch (err) {
    console.error("❌ Decrease error:", err);
    res.status(500).json({ 
      message: "Server error while decreasing item",
      error: err.message 
    });
  }
});

// ✅ Remove specific item
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    console.log("🗑️ Removing item - ProductId:", productId);

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemExists = cart.items.some(item => item.productId.toString() === productId.toString());
    
    if (!itemExists) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId.toString());
    await cart.save();
    await cart.populate("items.productId");

   // console.log("✅ Item removed successfully");
    res.status(200).json({ 
      message: "Item removed", 
      items: cart.items 
    });
  } catch (err) {
    console.error("❌ Remove item error:", err);
    res.status(500).json({ 
      message: "Server error while removing item",
      error: err.message 
    });
  }
});

// ✅ Clear full cart
router.post("/clear", auth, async (req, res) => {
  try {
    console.log("🧹 Clearing cart for user:", req.user._id);

    const result = await Cart.deleteOne({ userId: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Cart not found or already empty" });
    }

    //console.log("✅ Cart cleared successfully");
    res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    console.error("❌ Clear cart error:", err);
    res.status(500).json({ 
      message: "Server error while clearing cart",
      error: err.message 
    });
  }
});

// ✅ Place order
router.post("/place-order", auth, async (req, res) => {
  try {
    //console.log("📦 Processing order for user:", req.user._id);

    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => {
        if (!item.productId) {
          console.warn("⚠️ Product not found for cart item:", item);
          return sum;
        }
        return sum + (item.productId.price * item.quantity);
      },
      0
    );

    //console.log("💰 Order total:", total);

    // Generate HTML email content
    const htmlContent = `
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; margin: auto; background-color: #f9f9f9;">
    <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h2 style="color: white; margin: 0;">🛍️ Shoppy Store</h2>
      <p style="color: white; margin: 5px 0;">Order Confirmation</p>
    </div>

    <div style="padding: 30px; background-color: white;">
      <p style="font-size: 16px;">Hi <strong>${req.user.name}</strong>,</p>
      <p>Thank you for shopping with us! Your order has been confirmed.</p>

      <h3 style="color: #333; margin-top: 30px;">Order Details:</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Product</th>
            <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Qty</th>
            <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Price</th>
            <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${cart.items.map(item => `
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd;">${item.productId.name}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${item.productId.price}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #ddd;"><strong>₹${item.productId.price * item.quantity}</strong></td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f2f2f2;">
            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #4CAF50;"><strong>₹${total}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e9; border-radius: 5px;">
        <p style="margin: 0;">✅ We will notify you once your order is shipped.</p>
      </div>

      <p style="margin-top: 30px;">Thanks for choosing <strong>Shoppy!</strong> 💚</p>
    </div>

    <div style="padding: 20px; text-align: center; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
      <small style="color: #888;">This is an automated email. Please do not reply.</small>
      <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
        © ${new Date().getFullYear()} Shoppy Store. All rights reserved.
      </p>
    </div>
  </div>
`;

    try {
      // Send email to customer
      console.log("📧 Sending order confirmation to:", req.user.email);
      await sendEmail(
        req.user.email, 
        "Your Shoppy Order Confirmation", 
        htmlContent
      );

      // Send notification to admin
      if (process.env.ADMIN_EMAIL) {
        console.log("📧 Sending order notification to admin");
        await sendEmail(
        process.env.ADMIN_EMAIL, 
       `New Order from ${req.user.name}`, 
        htmlContent
        );
      }
      
      //console.log("✅ Emails sent successfully");
    } catch (emailError) {
      console.error("⚠️ Email sending failed:", emailError.message);
      // Continue with order processing even if email fails
    }

    // Save order to database
    const newOrder = new Order({
      user: req.user._id,
      products: cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
      })),
      totalAmount: total,
      status: "pending",
      createdAt: new Date()
    });

    await newOrder.save();
    console.log("✅ Order saved to database:", newOrder._id);

    // Clear the cart
    await Cart.deleteOne({ userId: req.user._id });
    //console.log("✅ Cart cleared after order placement");

    res.status(200).json({ 
      message: "Order placed successfully!",
      orderId: newOrder._id,
      totalAmount: total
    });

  } catch (err) {
    console.error("❌ Order placement error:", err);
    res.status(500).json({ 
      message: "Server error while placing order",
      error: err.message 
    });
  }
});

// ✅ Get user's order history (bonus feature)
router.get("/orders", auth, async (req, res) => {
  try {
    //console.log("📋 Fetching orders for user:", req.user._id);
    
    const orders = await Order.find({ user: req.user._id })
      .populate("products.productId")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    res.status(500).json({ 
      message: "Server error while fetching orders",
      error: err.message 
    });
  }
});

module.exports = router;