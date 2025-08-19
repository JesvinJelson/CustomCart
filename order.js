document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
  });
  
  function loadOrders() {
    fetch('/api/orders')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(orders => {
        renderOrders(orders);
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        alert('Error loading orders');
      });
  }
  
  function renderOrders(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';
  
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center">No orders found</td></tr>`;
      return;
    }
    
    orders.forEach(order => {
      const orderId = order.orderId || order._id;
      const date = new Date(order.orderDate).toLocaleDateString();
      const amount = order.totalAmount || order.total || 0;
      const status = order.status.toLowerCase();
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${orderId}</td>
        <td>${date}</td>
        <td>Rs. ${amount}</td>
        <td><span class="status-${status}">${order.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }
  