const products = [
  {
    id: 100,
    name: "Hoodies Woman Clearance",
    price: 350,
    image: "Hoodie1.jpg"
  },
  {
    id: 200,
    name: "Colourblock Hoodie",
    price: 700,
    image: "hoodie2.jpg"
  },
  {
    id: 300,
    name: " Limeade Gold",
    price: 450,
    image: "hoodie3.jpg"
  },
  {
    id: 400,
    name: "Hooded Pullover: Brown Wood",
    price: 650,
    image: "hoodie4.jpg"
  },
  {
    id: 500,
    name: "Corduroy Hoodie: Samurai Tiger",
    price: 500,
    image: "hoodie5.jpg"
  },
    
  {
    id: 600,
    name: "Others Hoodie",
    price: 500,
    image: "hoodie6.jpg"
  },
  {
    id: 700,
    name: " Oversized Fit Zipper Hoodie with Drawstrings",
    price: 500,
    image: "hoodie7.jpg"
  },
  {
    id: 800,
    name: "Regular Fit Hoodie with Kangaroo Pocket",
    price: 600,
    image: "hoodie8.jpg"
  },
  {
    id: 900,
    name: "Typographic Hoodie",
    price: 400,
    image: "hoodie9.jpg"
  },
  {
    id: 1000,
    name: "Men Brand Print Relaxed Fit Hoodie",
    price: 350,
    image: "hoodie10.jpg"
  },
  {
    id: 1100,
    name: "Men Oversized Hoodie",
    price: 550,
    image: "hoodie11.jpg"
  },
];

let cart = [];
let filteredProducts = [...products];

// Filter and sort functions (updated price ranges)
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
  
  handleSort();
};

// Render products with try-on functionality
function renderProducts() {
  const productsContainer = document.getElementById('products');
  productsContainer.innerHTML = filteredProducts.map(product => `
    <div class="product-card">
      <a href="${product.id}.html">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-price">Rs.${product.price}</p>
        </div>
      </a>
      <button onclick="addToCartWithSizeAndColor(${product.id})">Add to Cart</button>
      <button onclick="openTryOnPopup('${product.image}','${product.id}')">Try On</button>
    </div>
  `).join('');
}

// Try-on functionality
window.openTryOnPopup = (productImage, productId) => {
  const popupUrl = `../../shirts/project-bolt-sb1-tduwnram/project/Virtualtryon/1/GUItryon17.html?image=${encodeURIComponent(productImage)}&productId=${encodeURIComponent(productId)}`;
  window.open(
    popupUrl,
    "TryOnPopup",
    "width=500,height=500,scrollbars=yes,resizable=yes"
  );
};

// Cart operations with API integration
window.addToCartWithSizeAndColor = async (productId) => {
  try {
    const product = products.find(p => p.id === productId);
    const size = document.getElementById('size-select').value;
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

    // Default color for all hoodies
    const color = "Default"; 

    const cartData = {
      productid: product.id,
      pname: product.name,
      price: product.price,
      size: size,
      color: color,  // Always send default color
      quantity: quantity
    };

    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartData)
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const updatedCart = await response.json();
    const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").textContent = totalItems;
    alert("Item added to cart successfully!");

  } catch (error) {
    console.error("Error adding to cart:", error);
    alert("Error adding item to cart. Please try again.");
  }
};

// In renderCart function, keep color display but it will always show "Black"
async function renderCart() {
  try {
    const response = await fetch("/api/cart");
    const cartItems = await response.json();
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartContainer.innerHTML = cartItems.length === 0 
      ? "<p>Your cart is empty</p>"
      : cartItems.map(item => `
          <div class="cart-item">
            <h4>${item.pname}</h4>
            <p>Size: ${item.size}</p>
            ${/* Color will always show "Black" */ ''}
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

// Cart management functions
async function fetchCartItems() {
  try {
    const response = await fetch("/api/cart");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const cartItems = await response.json();
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").textContent = totalItems;
    
    return cartItems;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
}

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

async function renderCart() {
  try {
    const response = await fetch("/api/cart");
    const cartItems = await response.json();
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartContainer.innerHTML = cartItems.length === 0 
      ? "<p>Your cart is empty</p>"
      : cartItems.map(item => `
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

window.removeFromCart = async (productId) => {
  try {
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productid: productId }),
    });
    updateCartCount();
    await renderCart();
  } catch (error) {
    console.error("Error removing item:", error);
  }
};

// Modal and initialization
window.openModal = async () => {
  document.getElementById('cart-modal').style.display = 'block';
  await renderCart();
};

window.closeModal = () => {
  document.getElementById('cart-modal').style.display = 'none';
};

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing hoodies page...");
  await fetchCartItems();
  updateCartCount();
  renderProducts();
  
  // Initialize collapse components
  [].slice.call(document.querySelectorAll('.collapse'))
    .forEach(collapseEl => new bootstrap.Collapse(collapseEl, { toggle: false }));
});

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById('cart-modal');
  if (event.target === modal) closeModal();
};