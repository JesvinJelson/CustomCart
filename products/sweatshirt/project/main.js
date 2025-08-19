const products = [
  {
    id: 21,
    name: "Casual Womens Sweatshirts",
    price: 399,
    image: "sweatshirt1.jpg"
  },
  {
    id: 22,
    name: "Crewneck Long Sleeve",
    price: 350,
    image: "sweatshirt2.jpg"
  },
  {
    id: 23,
    name: "Crewneck Sweatshirt",
    price: 699,
    image: "sweatshirt3.jpg"
  },
  {
    id: 24,
    name: "Womens Oversized Sweatshirts",
    price: 400,
    image: "sweatshirt4.jpg"
  },
  {
    id: 25,
    name: "Women's Fleece Sweatshirt",
    price: 799,
    image: "sweatshirt5.jpg"
  },
  {
    id: 26,
    name: "Cropped Sweatshirt with Drop Sleeves",
    price: 599,
    image: "sweatshirt6.jpg"
  },
  {
    id: 27,
    name: "Block Sweatshirt",
    price: 477,
    image: "sweatshirt7.jpg"
  },
  {
    id: 28,
    name: "Long Neck Sweatshirt",
    price: 799,
    image: "sweatshirt8.jpg"
  },
  {
    id: 29,
    name: "Pullover Tops Casual Fall Outfits",
    price: 459,
    image: "sweatshirt9.jpg"
  },
  {
    id: 210,
    name: "Geometric Knit Slim Fit Sweatshirt",
    price: 999,
    image: "sweatshirt10.jpg"
  },
  {
    id: 211,
    name: "Knitted Slim Fit Crew-Neck Sweatshirt",
    price: 399,
    image: "sweatshirt11.jpg"
  }
];

let cart = [];
let filteredProducts = [...products];

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

window.openTryOnPopup = (productImage, productId) => {
  const popupUrl = `../../shirts/project-bolt-sb1-tduwnram/project/Virtualtryon/1/GUItryon17.html?image=${encodeURIComponent(productImage)}&productId=${encodeURIComponent(productId)}`;
  window.open(popupUrl, "TryOnPopup", "width=500,height=500,scrollbars=yes,resizable=yes");
};

window.addToCartWithSizeAndColor = async (productId) => {
  try {
    const product = products.find(p => p.id === productId);
    const size = document.getElementById('size-select').value;
    const colorInput = document.querySelector('input[name="color"]:checked');
    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    if (!product) {
      alert("Error: Product not found");
      return;
    }
    if (!size || !colorInput) {
      alert("Please select size and color");
      return;
    }
    const color = colorInput.value;
    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productid: product.id,
        pname: product.name,
        price: product.price,
        size: size,
        color: color,
        quantity: quantity
      })
    });
    const updatedCart = await response.json();
    document.getElementById("cart-count").textContent = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
    alert("Item added to cart!");
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to add item");
  }
};

async function fetchCartItems() {
  try {
    const response = await fetch("/api/cart");
    const cartItems = await response.json();
    document.getElementById("cart-count").textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return cartItems;
  } catch (error) {
    return [];
  }
}

async function updateCartCount() {
  try {
    const response = await fetch("/api/cart");
    const cartItems = await response.json();
    document.getElementById("cart-count").textContent = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function renderCart() {
  try {
    const response = await fetch("/api/cart");
    const cartItems = await response.json();
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    cartContainer.innerHTML = cartItems.length === 0 ? "<p>Your cart is empty</p>" : 
      cartItems.map(item => `
        <div class="cart-item">
          <h4>${item.pname}</h4>
          <p>Size: ${item.size}</p>
          <p>Color: ${item.color}</p>
          <p>Qty: ${item.quantity}</p>
          <p>Price: Rs.${item.price * item.quantity}</p>
          <button onclick="removeFromCart(${item.productid})">Remove</button>
        </div>
      `).join('');
    cartTotal.textContent = `Rs.${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}`;
  } catch (error) {
    document.getElementById('cart-items').innerHTML = "<p>Error loading cart</p>";
  }
}

window.removeFromCart = async (productId) => {
  try {
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productid: productId })
    });
    updateCartCount();
    renderCart();
  } catch (error) {
    console.error("Error:", error);
  }
};

window.openModal = async () => {
  document.getElementById('cart-modal').style.display = 'block';
  await renderCart();
};

window.closeModal = () => {
  document.getElementById('cart-modal').style.display = 'none';
};

document.addEventListener("DOMContentLoaded", async () => {
  await renderCart();
  updateCartCount();
  renderProducts();
});

window.onclick = (event) => {
  const modal = document.getElementById('cart-modal');
  if (event.target === modal) closeModal();
};
