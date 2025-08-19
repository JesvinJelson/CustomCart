const products = [
  {
    id: 1,
    name: "Kyoto Ramen Cat Graphic T-Shirt",
    price: 1600,
    image: "shirt17.jpg"
  },
  {
    id: 2,
    name: "Funny Clash Royale Shirt , Gamer T-Shirt ",
    price: 700,
    image: "shirt8.jpg"
  },
  {
    id: 3,
    name: "Pink White Lily T-Shirt",
    price: 500,
    image: "shirt15.jpg"
  },
  {
    id: 4,
    name: "Basgiath Comfort Colors",
    price: 799,
    image: "shirt14.jpg"
  },
  {
    id: 5,
    name: "Custom Comfort Colors Vintage Pet TShirt",
    price: 525,
    image: "shirt6.jpg"
  },
  {
    id: 6,
    name: "Perfectly Imperfect T-Shirt",
    price: 1400,
    image: "shirt7.jpg"
  },
  {
    id: 7,
    name: "Hilarious Retro Cactus T-Shirt",
    price: 1500,
    image: "shirt16.jpg"
  },
  {
    id: 8,
    name: " Aesthetic Graphic Retro Vintage T Shirt",
    price: 1300,
    image: "shirt9.jpg"
  },
  {
    id: 9,
    name: "Garfie Shirt",
    price: 2209,
    image: "shirt10.jpg"
  },
  {
    id: 10,
    name: " Acid Wash Oversize T-Shirt",
    price: 2000,
    image: "shirt11.jpg"
  },
  {
    id: 11,
    name: "Lily Flower Graphic T-Shirt ",
    price: 999,
    image: "shirt12.jpg"
  },
  {
    id: 12,
    name: "Midnight Society ",
    price: 1000,
    image: "shirt13.jpg"
  },
];

let cart = [];
let filteredProducts = [...products];

// Filter and sort functions
window.handleSort = () => {
  const sortValue = document.getElementById('sort').value;
  
  switch(sortValue) {
    case 'price-low':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    default:
      filteredProducts.sort((a, b) => a.id - b.id);
  }
  
  renderProducts();
};

window.handlePriceFilter = () => {
  const filterValue = document.getElementById('price-range').value;
  
  switch(filterValue) {
    case 'below 1000':
      filteredProducts = products.filter(product => product.price < 1000);
      break;
    case '500-1000':
      filteredProducts = products.filter(product => product.price >= 500 && product.price <= 1000);
      break;
    case '1000+':
      filteredProducts = products.filter(product => product.price > 1000);
      break;
    default:
      filteredProducts = [...products];
  }
  
  // Maintain current sort
  handleSort();
};

// Render products
function renderProducts() {
  const productsContainer = document.getElementById('products');
  productsContainer.innerHTML = filteredProducts.map(product => `
    <!-- Inside index.html, modify the product card template in renderProducts function: -->
    <link rel="stylesheet" href="style.css">
<div class="product-card">
    <a href="${product.id}.html">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">Rs.${product.price}</p>
        </div>
    </a>
    <a href="${product.id}.html">
    <button onclick="addToCartWithSize(${product.id})">Add to Cart</button></a>
    <button onclick="openTryOnPopup('${product.image}','${product.id}')">Try On</button>
</div>
  `).join('');
}

// Function to open GUItryon.html in a pop-up window with the product image
window.openTryOnPopup = (productImage,productId) => {
  const popupUrl = `Virtualtryon/1/GUItryon17.html?image=${encodeURIComponent(productImage)}&productId=${encodeURIComponent(productId)}`;
  window.open(
    popupUrl, 
    "TryOnPopup",
    "width=500,height=500,scrollbars=yes,resizable=yes" 
  );
};

//Add to cart
/*
window.addToCart = async (productId) => {
  const product = products.find(p => p.id === productId);
  
  if (!product) {
      console.error("ERROR: Product not found:", productId);
      return;
  }

  console.log("Sending to backend:", {
      productid: product.id,
      pname: product.name,
      price: product.price
  });

  try {
      const response = await fetch("/api/cart/add", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productid: product.id,
            pname: product.name,
            price: product.price
          }),
      });

      const result = await response.json();
      console.log("Cart Updated:", result);

      // Update the cart count after adding to cart
      updateCartCount();
      renderCart(); // Refresh the cart display

  } catch (error) {
      console.error("Error adding to cart:", error);
  }
};
*/
// Update the addToCart function to include size and color
window.addToCartWithSizeAndColor = async (productId) => {
  try {
    const product = products.find(p => p.id === productId);
    const size = document.getElementById('size-select').value;
    const colorInput = document.querySelector('input[name="color"]:checked');
    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    if (!product) {
      console.error("Product not found:", productId);
      alert("Error: Product not found");
      return;
    }

    if (!size) {
      alert("Please select a size");
      return;
    }

    if (!colorInput) {
      alert("Please select a color");
      return;
    }

    const color = colorInput.value;

    const cartData = {
      productid: product.id,
      pname: product.name,
      price: product.price,
      size: size,
      color: color,
      quantity: quantity
    };

    console.log("Sending to server:", cartData);

    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cartData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedCart = await response.json();
    console.log("Updated cart:", updatedCart);

    // Update cart count in UI
    const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").textContent = totalItems;

    alert("Item added to cart successfully!");

  } catch (error) {
    console.error("Error adding to cart:", error);
    alert("Error adding item to cart. Please try again.");
  }
};

// Add this function to fetch and display cart items
async function fetchCartItems() {
  try {
    const response = await fetch("/api/cart");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const cartItems = await response.json();
    console.log("Fetched cart items:", cartItems);
    
    // Update cart count
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").textContent = totalItems;
    
    return cartItems;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
}

// Add this to initialize cart on page load
document.addEventListener("DOMContentLoaded", async () => {
  await fetchCartItems();
});



// Update cart count
async function updateCartCount() {
  try {
    const response = await fetch("/api/cart");
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const cartItems = await response.json();
    const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    document.getElementById("cart-count").textContent = totalItems; 
  } catch (error) {
    console.error("Error updating cart count:", error);
  }
}


// Initialize cart count on page load
document.addEventListener("DOMContentLoaded", updateCartCount);


// Update the renderCart function to include size and color
async function renderCart() {
  try {
    const response = await fetch("/api/cart");
    const cartItems = await response.json();
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (cartItems.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty</p>";
      cartTotal.textContent = "Rs.0";
      return;
    }

    cartContainer.innerHTML = cartItems.map(item => `
      <div class="cart-item">
        <h4>${item.pname}</h4>
        <p>Size: ${item.size}</p>
        <p>Color: ${item.color}</p>
        <p>Qty: ${item.quantity}</p>
        <p>Price: Rs.${item.price * item.quantity}</p>
        <button onclick="removeFromCart(${item.productid})">Remove</button>
      </div>
    `).join('');

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `Rs.${total}`;
  } catch (error) {
    console.error("Error loading cart:", error);
    document.getElementById('cart-items').innerHTML = "<p>Error loading cart.</p>";
  }
}



//remove from cart

window.removeFromCart = async (productId) => {
  try {
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productid: productId }),
    });

    updateCartCount();
    renderCart();
  } catch (error) {
    console.error("Error removing item:", error);
  }
};


// Modal functions
window.openModal = async () => {
  document.getElementById('cart-modal').style.display = 'block';
  await renderCart(); // Render the cart when the modal opens
};

window.closeModal = () => {
  document.getElementById('cart-modal').style.display = 'none';
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page loaded, fetching cart and rendering products...");
  await renderCart(); // Render the cart
  updateCartCount(); // Update the cart count
  renderProducts(); // Render the products initially
});

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById('cart-modal');
  if (event.target === modal) {
    closeModal();
  }

  window.openCartModal = async () => {
    document.getElementById("cart-modal").style.display = "block";
    await renderCart();
};

window.closeCartModal = () => {
    document.getElementById("cart-modal").style.display = "none";
};

};
