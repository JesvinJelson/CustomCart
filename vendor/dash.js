// Vendor Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Initialize dashboard by loading orders and setting up event listeners.
  loadOrders();
  setupEventListeners();
  
  // Show orders section by default.
  showSection('orders');
});

// Set up navigation event listeners.
function setupEventListeners() {
  // Tab switching.
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = e.target.id.replace('-tab', '');
      showSection(section);
      // Update active state.
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');
    });
  });
  
  // Status filter change event.
  document.getElementById('status-filter').addEventListener('change', loadOrders);
  
  // Search functionality with debounce.
  document.getElementById('order-search').addEventListener('input', debounce(loadOrders, 300));
}

// Show/hide dashboard sections.
function showSection(sectionName) {
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(`${sectionName}-section`).style.display = 'block';
}

// Load orders from the vendor API endpoint with filtering.
async function loadOrders() {
  try {
    const statusFilter = document.getElementById('status-filter').value;
    const searchQuery = document.getElementById('order-search').value;

    const response = await fetch(`/api/vendor/orders?status=${statusFilter}&search=${searchQuery}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const orders = await response.json();
    renderOrders(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
    showError('Failed to load orders');
  }
}




// Render orders into the orders table.
function renderOrders(orders) {
  const ordersList = document.getElementById('orders-list');
  
  if (orders.length === 0) {
    ordersList.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
    return;
  }
  
  ordersList.innerHTML = orders.map(order => `
    <tr>
        <td>${order._id || order.orderId}</td>
        <td>${order.username || (order.user ? order.user.username : 'N/A')}</td>
        <td>${new Date(order.orderDate || order.createdAt).toLocaleDateString()}</td>
        <td>Rs.${order.totalAmount || order.total}</td>
        <td>
            <span class="status-${order.status.toLowerCase()}">${order.status}</span>
        </td>
        <td>
            <button class="btn btn-sm btn-info mr-1" onclick="viewOrderDetails('${order._id || order.orderId}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${order._id || order.orderId}')">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    </tr>
  `).join('');
}

// View order details in a modal.
async function viewOrderDetails(orderId) {
  try {
    const response = await fetch(`/api/vendor/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    const order = await response.json();
    
    const modalContent = document.getElementById('order-details-content');
    
    // Make the template more flexible to handle different field structures
    modalContent.innerHTML = `
      <div class="order-details">
          <div class="order-detail-row">
              <h5>Order Information</h5>
              <p>Order ID: ${order._id || order.orderId}</p>
              <p>Date: ${new Date(order.orderDate || order.createdAt).toLocaleString()}</p>
              <p>Status: <span class="status-${order.status.toLowerCase()}">${order.status}</span></p>
          </div>
          <div class="order-detail-row">
              <h5>Customer Information</h5>
              <p>Name: ${order.username || (order.user ? order.user.username : 'N/A')}</p>
              <p>Email: ${order.billing ? order.billing.email : (order.user ? order.user.email : 'N/A')}</p>
          </div>
          <div class="order-detail-row">
              <h5>Shipping Address</h5>
              ${order.billing ? `
                <p>${order.billing.address || order.billing.street || 'N/A'}</p>
                <p>${order.billing.city || 'N/A'}, ${order.billing.state || 'N/A'} ${order.billing.zipCode || order.billing.zip || 'N/A'}</p>
                <p>Phone: ${order.billing.mobile || order.billing.phone || 'N/A'}</p>
              ` : '<p>No shipping information available</p>'}
          </div>
          <div class="order-detail-row">
              <h5>Order Items</h5>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items ? order.items.map(item => `
                    <tr>
                      <td>${item.pname}${item.customText ? ` (${item.customText})` : ''}</td>
                      <td>Rs.${item.price}</td>
                      <td>${item.quantity}</td>
                      <td>Rs.${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="4">No items found</td></tr>'}
                </tbody>
                <tfoot>
                  <tr>
                    <th colspan="3" class="text-right">Total:</th>
                    <th>Rs.${order.totalAmount || order.total}</th>
                  </tr>
                </tfoot>
              </table>
          </div>
      </div>
    `;
    
    // Update status action buttons
    updateStatusButtons(order);
    
    // Show modal using Bootstrap's modal method.
    $('#orderDetailsModal').modal('show');
  } catch (error) {
    console.error('Error loading order details:', error);
    showError('Failed to load order details');
  }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    // If newStatus not provided, prompt vendor for a new status.
    const status = newStatus || prompt("Enter new status (processing, shipped, delivered, cancelled):");
    if (!status) return;
    
    // FIXED: Use the correct API endpoint for updating order status
    const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) throw new Error('Failed to update status');
    
    // After successful update, refresh orders list and close modal.
    loadOrders();
    $('#orderDetailsModal').modal('hide');
    showSuccess('Order status updated successfully');
  } catch (error) {
    console.error('Error updating order status:', error);
    showError('Failed to update order status');
  }
}

// Update status action buttons in the modal based on current order status.
function updateStatusButtons(order) {
  const buttonContainer = document.getElementById('status-action-buttons');
  const currentStatus = order.status.toLowerCase();
  
  let buttons = '';
  
  // If order is pending, allow vendor to accept (mark as processing) or cancel.
  if (currentStatus === 'pending') {
    buttons = `
      <button class="btn btn-info" onclick="updateOrderStatus('${order._id || order.orderId}', 'processing')">
        Accept Order (Mark Processing)
      </button>
      <button class="btn btn-danger" onclick="updateOrderStatus('${order._id || order.orderId}', 'cancelled')">
        Cancel Order
      </button>
    `;
  } else if (currentStatus === 'processing') {
    // Additional buttons if needed.
    buttons = `
      <button class="btn btn-primary" onclick="updateOrderStatus('${order._id || order.orderId}', 'shipped')">
        Mark Shipped
      </button>
    `;
  } else if (currentStatus === 'shipped') {
    buttons = `
      <button class="btn btn-success" onclick="updateOrderStatus('${order._id || order.orderId}', 'delivered')">
        Mark Delivered
      </button>
    `;
  }
  
  buttonContainer.innerHTML = buttons;
}

// Utility functions for debouncing and notifications.
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Replace showError and showSuccess with actual UI notifications
function showError(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="close" data-dismiss="alert">&times;</button>
  `;
  document.body.prepend(alertDiv);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    $(alertDiv).alert('close');
  }, 5000);
}

function showSuccess(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="close" data-dismiss="alert">&times;</button>
  `;
  document.body.prepend(alertDiv);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    $(alertDiv).alert('close');
  }, 5000);
}