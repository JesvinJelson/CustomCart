const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require('dotenv').config();
const Razorpay = require('razorpay');
// Removed csurf requirement
// const csurf = require('csurf');
const session = require("express-session");
const MongoStore = require("connect-mongo");
const nodemailer = require('nodemailer');

const app = express();

// Use session secret from environment variables
const sessionSecret = process.env.SESSION_SECRET || "default_secret_change_me";

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/MiniProject",
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

// Removed CSRF protection middleware
// app.use(csurf());

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});
console.log("Razorpay Key:", process.env.RAZORPAY_KEY);

// Schemas and Models
const orderSchema = new mongoose.Schema({
  orderId: String,
  paymentId: String,
  username: String,
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [{
    productid: Number,
    pname: String,
    price: Number,
    quantity: Number,
    size: String,
    color: String,
    customText: String
  }],
  billing: {
    firstName: String,
    lastName: String,
    email: String,
    mobile: String,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  totalAmount: Number,
  notes: String
});
const Order = mongoose.model("Order", orderSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  isVendor: { type: Boolean, default: false }
});
const User = mongoose.model("User", userSchema);

// Cart Schemas
const Cart = mongoose.model("Cart", new mongoose.Schema({
  username: String,
  items: [{
    productid: {
      type: Number,
      required: true
    },
    pname: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    }
  }]
}));

const CartP = mongoose.model("CartP", new mongoose.Schema({
  username: String,
  items: [{
    productid: Number,
    pname: String,
    price: Number,
    quantity: Number,
    customText: String
  }]
}));

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session.user) {  
    next(); 
  } else {
    res.redirect("/");
  }
}

// Middleware to check if user is vendor
function isVendor(req, res, next) {
  if (req.session.user && req.session.user.isVendor) {
    next();
  } else {
    res.status(403).json({ error: "Vendor access required" });
  }
}

// Payment initiation endpoint (merged duplicate)
app.post('/api/create-order', isAuthenticated, async (req, res) => {
  try {
    const { amount, billing } = req.body;
    
    // Validate amount and billing info (basic validation)
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!billing || !billing.firstName || !billing.email) {
      return res.status(400).json({ error: "Incomplete billing information" });
    }
    
    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: "order_rcpt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY
      // Removed csrfToken reference
    });
    
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// Save order after successful payment
app.post('/api/save-order', isAuthenticated, async (req, res) => {
  try {
    const { paymentId, orderId, billing } = req.body;
    const username = req.session.user.username;
    
    // Fetch cart items
    const regularCart = await Cart.findOne({ username });
    const personalizedCart = await CartP.findOne({ username });
    
    // Combine all items
    let allItems = [];
    if (regularCart && regularCart.items) {
      allItems = [...regularCart.items];
    }
    if (personalizedCart && personalizedCart.items) {
      allItems = [...allItems, ...personalizedCart.items];
    }
    
    // Calculate total price
    const totalAmount = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create new order
    const newOrder = new Order({
      orderId,
      paymentId,
      username,
      items: allItems,
      billing,
      totalAmount,
      status: 'pending'
    });
    
    await newOrder.save();
    
    // Clear the carts after order is placed
    if (regularCart) {
      regularCart.items = [];
      await regularCart.save();
    }
    if (personalizedCart) {
      personalizedCart.items = [];
      await personalizedCart.save();
    }
    
    // Send order confirmation email
    await sendOrderConfirmationEmail(username, billing.email, orderId, totalAmount);
    
    res.json({ success: true, orderId });
    
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ error: "Failed to save order" });
  }
});

async function sendOrderConfirmationEmail(username, email, orderId, amount) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CustomCart - Order Confirmation',
      html: `
        <h1>Order Confirmation</h1>
        <p>Dear ${username},</p>
        <p>Thank you for your order! Your order ID is <strong>${orderId}</strong>.</p>
        <p>Order Total: Rs.${amount}</p>
        <p>We will notify you when your order is processed.</p>
        <p>If you have any questions, please contact our customer support.</p>
        <p>Best Regards,</p>
        <p>CustomCart Team</p>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Order confirmation page
app.get('/order-confirmation', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "order-confirmation.html"));
});

// Get order by ID
app.get('/api/vendor/orders/:orderId', isVendor, async (req, res) => {
  try {
    // Try to find by _id first, then by orderId if that fails
    let order = await Order.findById(req.params.orderId);
    
    if (!order) {
      order = await Order.findOne({ orderId: req.params.orderId });
    }
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Get user's orders
app.get('/api/orders', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ username: req.session.user.username })
                              .sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Vendor dashboard orders endpoint – returns all orders (from all users)
app.get('/api/vendor/orders', isVendor, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // Apply status filter if provided and not set to 'all'
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply search filter for orderId, username, firstName, or lastName
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { 'billing.firstName': { $regex: search, $options: 'i' } },
        { 'billing.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch all orders matching the query
    const orders = await Order.find(query).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


// Update order status (vendor only)
app.put('/api/vendor/orders/:orderId/status', isVendor, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId },
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    // Send status update email
    await sendOrderStatusEmail(order.billing.email, order.orderId, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

async function sendOrderStatusEmail(email, orderId, status) {
  try {
    const statusMessages = {
      processing: 'Your order is now being processed',
      shipped: 'Your order has been shipped',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled'
    };
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `CustomCart - Order ${orderId} Status Update`,
      html: `
        <h1>Order Status Update</h1>
        <p>Your order (${orderId}) status has been updated.</p>
        <p><strong>New Status: ${status}</strong></p>
        <p>${statusMessages[status] || ''}</p>
        <p>If you have any questions, please contact our customer support.</p>
        <p>Best Regards,</p>
        <p>CustomCart Team</p>
      `
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending status update email:", error);
  }
}

// Cart endpoints
app.get("/api/cart", isAuthenticated, async (req, res) => {
  try {
    const username = req.session.user.username;
    const cart = await Cart.findOne({ username });
    res.json(cart ? cart.items : []);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cart data" });
  }
});

app.post("/api/cart/add", isAuthenticated, async (req, res) => {
  try {
    const { productid, pname, price, size, color, quantity } = req.body;
    const username = req.session.user.username;

    let cart = await Cart.findOne({ username });
    if (!cart) {
      cart = new Cart({ username, items: [] });
    }
    cart.items.push({
      productid,
      pname,
      price,
      size,
      color,
      quantity: parseInt(quantity) || 1
    });
    await cart.save();
    res.json(cart.items);
  } catch (error) {
    res.status(500).json({ error: "Error adding item to cart" });
  }
});

app.post("/api/cart/update", isAuthenticated, async (req, res) => {
  const { productid, quantity } = req.body;
  const username = req.session.user.username;
  try {
    const cart = await Cart.findOne({ username });
    if (cart) {
      const item = cart.items.find(item => item.productid === productid);
      if (item) {
        item.quantity = quantity;
        await cart.save();
        res.json(cart.items);
      } else {
        res.status(404).json({ error: "Item not found in cart" });
      }
    } else {
      res.status(404).json({ error: "Cart not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating cart" });
  }
});

app.post("/api/cart/remove", isAuthenticated, async (req, res) => {
  const { productid } = req.body;
  const username = req.session.user.username;
  try {
    const cart = await Cart.findOne({ username });
    if (cart) {
      cart.items = cart.items.filter(item => item.productid !== productid);
      await cart.save();
      res.json(cart.items);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: "Error removing item from cart" });
  }
});

// Personalized cart endpoints
app.post("/api/cartp/add", isAuthenticated, async (req, res) => {
  try {
    const { productid, pname, price, customText, quantity } = req.body;
    const username = req.session.user.username;
    let cart = await CartP.findOne({ username }) || new CartP({ username, items: [] });
    
    cart.items.push({
      productid,
      pname,
      price,
      customText,
      quantity: parseInt(quantity) || 1
    });
    await cart.save();
    res.json(cart.items);
  } catch (error) {
    res.status(500).json({ error: "Error adding item to personalized cart" });
  }
});

app.get("/api/cartp", isAuthenticated, async (req, res) => {
  try {
    const cart = await CartP.findOne({ username: req.session.user.username });
    res.json(cart ? cart.items : []);
  } catch (error) {
    res.status(500).json({ error: "Error fetching personalized cart" });
  }
});

app.post("/api/cartp/remove", isAuthenticated, async (req, res) => {
  try {
    const { productid } = req.body;
    const cart = await CartP.findOne({ username: req.session.user.username });
    if (cart) {
      cart.items = cart.items.filter(item => item.productid !== productid);
      await cart.save();
    }
    res.json(cart ? cart.items : []);
  } catch (error) {
    res.status(500).json({ error: "Error removing item" });
  }
});



// User authentication routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "account.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "account.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "account.html")));
app.get("/index", isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/vendor/dashboard", isVendor, (req, res) => res.sendFile(path.join(__dirname, "dash.html")));




// Fix the login route to properly set the vendor flag
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
      const user = await User.findOne({ username, password });
      if (user) {
          req.session.user = { 
              username: user.username, 
              isVendor: user.isVendor || false
          };
          console.log("Session set:", req.session.user); // Debugging log

          res.redirect(user.isVendor ? "/vendor/dashboard" : "/index");
      } else {
          res.redirect("/login?error=1");
      }
  } catch (error) {
      console.error("Login error:", error);
      res.status(500).send("Server error.");
  }
});

/** 
// In /login route after setting req.session.user
req.session.save((err) => {
  if (err) console.error("Session save error:", err);
  if (User.isVendor) {
    res.redirect("/vendor/dashboard");
  } else {
    res.redirect("/index");
  }
});*/

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.redirect("/register?error=1");
    }
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.redirect("/index");
  } catch (error) {
    res.status(500).send("Server error, please try again later.");
  }
});

app.get("/api/username", (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(401).send("Not logged in");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Error logging out");
    } else {
      res.redirect("/");
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Connect to MongoDB and start server
mongoose.connect("mongodb://127.0.0.1:27017/MiniProject")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => console.log("Server running on http://localhost:3000"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
