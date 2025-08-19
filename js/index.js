const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");

// Initialize app
const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'css', 'js', 'img', 'lib', and 'mail' directories
console.log("Serving CSS from: ", path.join(__dirname, '../css'));
console.log("Serving JS from: ", path.join(__dirname, '../js'));
console.log("Serving IMG from: ", path.join(__dirname, '../img'));
console.log("Serving LIB from: ", path.join(__dirname, '../lib'));
console.log("Serving MAIL from: ", path.join(__dirname, '../mail'));

app.use('../css', express.static(path.join(__dirname, '../css')));
app.use('../js', express.static(path.join(__dirname, '../js')));
app.use('../img', express.static(path.join(__dirname, '../img')));
app.use('../lib', express.static(path.join(__dirname, '../lib')));
app.use('../mail', express.static(path.join(__dirname, '../mail')));

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/customCartDB");

// Define MongoDB Schema and Model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../account.html")); // Send HTML file
});

// Handle Login Form Submission
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (user) {
      res.send("Login successful! Welcome back.");
    } else {
      res.send("Invalid username or password.");
    }
  } catch (error) {
    res.status(500).send("Server error, please try again later.");
  }
});

// Handle Register Form Submission
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.send("Username already exists. Please choose another one.");
    } else {
      const newUser = new User({ username, email, password });
      await newUser.save();
      res.send("Registration successful! You can now log in.");
    }
  } catch (error) {
    res.status(500).send("Server error, please try again later.");
  }
});

// Start the Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
