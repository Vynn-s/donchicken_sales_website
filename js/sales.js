// Product Prices
const productPrices = {
  chicken: 33,
  drink: 20,
  rice: 10,
  atsara: 15,
  empanada: 15,
  soy: 15,
  neck: 10,
  mango_float: 120,
};

// Initialize quantities
let quantities = {
  chicken: 0,
  drink: 0,
  rice: 0,
  atsara: 0,
  empanada: 0,
  soy: 0,
  neck: 0,
  mango_float: 0,
};

// Log data
let salesLog = [];

// Fetch sales data from the server
async function fetchSalesData() {
  try {
    const response = await fetch('http://localhost:3000/data');
    const data = await response.json();
    salesLog = data.map(sale => ({
      ...sale,
      unit_price: parseFloat(sale.unit_price),
      total_price: parseFloat(sale.total_price)
    }));
    updateLogTable();
  } catch (error) {
    console.error("Error fetching sales data:", error);
  }
}

// Update total price
function updateTotalPrice() {
  // Calculate total for predefined items only
  const total = Object.keys(quantities).reduce((sum, product) => {
    return sum + quantities[product] * productPrices[product];
  }, 0);

  document.getElementById('totalPrice').textContent = `${total.toFixed(2)}`;
}

// Handle button clicks for predefined product cards
document.querySelectorAll('.plus-btn, .minus-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const product = button.getAttribute('data-product');
    if (button.classList.contains('plus-btn')) {
      quantities[product]++;
    } else if (button.classList.contains('minus-btn') && quantities[product] > 0) {
      quantities[product]--;
    }
    document.querySelector(`.quantity[data-product="${product}"]`).textContent = quantities[product];
    updateTotalPrice(); // Update the total price
  });
});

// Confirmation Modal
document.getElementById('submitSale').addEventListener('click', () => {
  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  if (totalItems === 0 && salesLog.length === 0) {
    alert('Please add at least one item before submitting.');
    return;
  }
  document.getElementById('confirmationModal').style.display = 'flex';
});

document.getElementById('confirmSale').addEventListener('click', async () => {
  const timestamp = new Date().toLocaleString();

  const salesData = Object.keys(quantities)
      .filter(product => quantities[product] > 0)
      .map(product => ({
          name: product.charAt(0).toUpperCase() + product.slice(1),
          category: product,
          unitPrice: productPrices[product],
          quantity: quantities[product],
          totalPrice: quantities[product] * productPrices[product],
          timestamp: timestamp
      })).concat(salesLog);

  try {
      const response = await fetch('http://localhost:3000/submit-sale', {  // Ensure the URL is correct
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sales: salesData })
      });

      const result = await response.json();
      
      if (response.ok) {
          // Reset quantities after submission
          Object.keys(quantities).forEach(product => {
              quantities[product] = 0;
              document.querySelector(`.quantity[data-product="${product}"]`).textContent = 0;
          });

          salesLog = []; // Clear custom items log
          updateTotalPrice(); // Reset the total price
          fetchSalesData(); // Fetch and update the sales log table

          // Show success popup
          const successPopup = document.getElementById('successPopup');
          successPopup.style.display = 'flex';
          setTimeout(() => {
            successPopup.style.display = 'none';
          }, 3000); // Hide after 3 seconds

          // Play success sound
          playSuccessSound();
      } else {
          alert(result.message);
      }
  } catch (error) {
      console.error("Error submitting sales:", error);
      alert("Failed to submit sales.");
  }

  document.getElementById('confirmationModal').style.display = 'none';
});


document.getElementById('cancelSale').addEventListener('click', () => {
  document.getElementById('confirmationModal').style.display = 'none';
});

// Update log table
function updateLogTable() {
  const logBody = document.getElementById('logBody');
  logBody.innerHTML = salesLog
    .map(
      (sale, index) => `
      <tr data-index="${index}">
        <td>${sale.name}</td>
        <td>${sale.category}</td>
        <td>₱${sale.unit_price.toFixed(2)}</td>
        <td>${sale.quantity}</td>
        <td>₱${sale.total_price.toFixed(2)}</td>
        <td>${new Date(sale.timestamp).toLocaleString()}</td>
        <td><button class="edit-btn" data-index="${index}">Edit</button></td>
        <td><button class="delete-btn" data-index="${index}">Delete</button></td>
      </tr>
    `
    )
    .join('');

  // Show/hide empty state
  const emptyState = document.getElementById('emptyState');
  if (emptyState) {
    emptyState.style.display = salesLog.length === 0 ? 'table-row' : 'none';
  }

  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const index = event.target.getAttribute('data-index');
      openUpdateModal(index);
    });
  });

  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const index = event.target.getAttribute('data-index');
      await deleteSale(index);
    });
  });
}

// Open update modal
function openUpdateModal(index) {
  selectedSaleIndex = index;
  const selectedSale = salesLog[selectedSaleIndex];
  document.getElementById('updateItem').value = selectedSale.name;
  document.getElementById('updatePrice').value = selectedSale.unit_price;
  document.getElementById('updateQuantity').value = selectedSale.quantity;
  document.getElementById('updateModal').style.display = 'flex';
}

// Close update modal
document.getElementById('closeUpdateModal').addEventListener('click', () => {
  document.getElementById('updateModal').style.display = 'none';
});

// Update form submit
document.getElementById('updateForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const newItem = document.getElementById('updateItem').value;
  const newPrice = parseFloat(document.getElementById('updatePrice').value);
  const newQuantity = parseInt(document.getElementById('updateQuantity').value);

  if (newPrice >= 0 && newQuantity >= 0) {
    const selectedSale = salesLog[selectedSaleIndex];
    const updatedSale = {
      ...selectedSale,
      name: newItem.charAt(0).toUpperCase() + newItem.slice(1),
      category: newItem.toLowerCase(),
      unit_price: newPrice,
      quantity: newQuantity,
      total_price: newQuantity * newPrice
    };

    await updateSaleInDatabase(updatedSale);

    const row = document.querySelector(`tr[data-index="${selectedSaleIndex}"]`);
    row.classList.add('fade-out');
    setTimeout(() => {
      salesLog[selectedSaleIndex] = updatedSale;
      updateLogTable();
      updateTotalPrice();
      document.getElementById('updateModal').style.display = 'none';
      row.classList.remove('fade-out');
      row.classList.add('fade-in');
    }, 500);
  }
});

// Delete sale
async function deleteSale(index) {
  const saleToDelete = salesLog[index];
  const row = document.querySelector(`tr[data-index="${index}"]`);
  row.classList.add('fade-out');
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:3000/delete-sale/${saleToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        salesLog.splice(index, 1); // Remove the item from the array
        updateLogTable(); // Refresh the table
        updateTotalPrice(); // Update the total price
      } else {
        alert('Failed to delete sale.');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  }, 500);
}

// Update sale in database
async function updateSaleInDatabase(updatedSale) {
  try {
    const response = await fetch(`http://localhost:3000/update-sale/${updatedSale.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSale)
    });

    if (!response.ok) {
      alert('Failed to update sale.');
    }
  } catch (error) {
    console.error('Error updating sale:', error);
  }
}

// Dark Mode
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Custom Item Modal Logic
document.getElementById('addCustomItem').addEventListener('click', () => {
  document.getElementById('customItemModal').style.display = 'flex';
});

document.getElementById('closeCustomItemModal').addEventListener('click', () => {
  document.getElementById('customItemModal').style.display = 'none';
});

document.getElementById('customItemForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const itemName = document.getElementById('customItemName').value;
  const itemPrice = parseFloat(document.getElementById('customItemPrice').value);
  const itemQuantity = parseInt(document.getElementById('customItemQuantity').value);

  if (itemName && itemPrice >= 0 && itemQuantity >= 1) {
    const customSale = [{
      name: itemName,
      category: 'Custom',
      unitPrice: itemPrice,
      quantity: itemQuantity,
      totalPrice: itemPrice * itemQuantity,
      timestamp: new Date().toLocaleString()
    }];

    try {
      const response = await fetch('http://localhost:3000/submit-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: customSale })
      });

      if (response.ok) {
        // Clear the form
        document.getElementById('customItemForm').reset();
        document.getElementById('customItemModal').style.display = 'none';

        // Show success popup
        const successPopup = document.getElementById('successPopup');
        successPopup.style.display = 'flex';
        setTimeout(() => {
          successPopup.style.display = 'none';
        }, 3000);

        // Refresh the sales log
        fetchSalesData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit custom item');
      }
    } catch (error) {
      console.error('Error submitting custom item:', error);
      alert('Failed to submit custom item: ' + error.message);
    }
  } else {
    alert('Please fill in all fields correctly.');
  }
});

// Success sound
function playSuccessSound() {
  const audio = new Audio('../assets/sounds/success-sound.mp3'); // Ensure the path is correct
  audio.play().catch(error => console.error('Error playing sound:', error));
}

// Initialize total price
updateTotalPrice();

// Fetch and update sales data on page load
fetchSalesData();

// Add these functions to initialize user info and datetime
function updateDateTime() {
  const now = new Date();
  const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
  document.getElementById('currentDateTime').textContent = formatted;
}

function initializeUserInfo() {
  const userName = localStorage.getItem('userName') || 'Vynn-s';
  document.getElementById('currentUser').textContent = userName;
  updateDateTime();
}

// Add mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle.addEventListener('click', () => {
  mainNav.classList.toggle('active');
  const icon = menuToggle.querySelector('i');
  if (mainNav.classList.contains('active')) {
    icon.classList.remove('ri-menu-line');
    icon.classList.add('ri-close-line');
  } else {
    icon.classList.remove('ri-close-line');
    icon.classList.add('ri-menu-line');
  }
});

// Initialize
initializeUserInfo();
setInterval(updateDateTime, 1000);

// Add to your sales.js
function updateQuantityInput(product) {
  const input = document.querySelector(`.quantity-input[data-product="${product}"]`);
  const value = parseInt(input.value) || 0;
  quantities[product] = Math.max(0, value); // Ensure non-negative
  updateTotalPriceWithAnimation();
}

function updateTotalPriceWithAnimation() {
  const totalElement = document.getElementById('totalPrice');
  totalElement.classList.add('price-update-animation');
  
  // Calculate new total
  const total = Object.keys(quantities).reduce((sum, product) => {
    return sum + quantities[product] * productPrices[product];
  }, 0);
  
  totalElement.textContent = `${total.toFixed(2)}`;
  
  // Remove animation class after animation completes
  setTimeout(() => {
    totalElement.classList.remove('price-update-animation');
  }, 500);
}

// Update your product card HTML to include input
function createProductCard(product) {
  return `
    <div class="quantity-controls">
      <button class="minus-btn" data-product="${product}">-</button>
      <input type="number" class="quantity-input" data-product="${product}" 
             value="${quantities[product]}" min="0" 
             onchange="updateQuantityInput('${product}')" />
      <button class="plus-btn" data-product="${product}">+</button>
    </div>
  `;
}

function updateTotalPriceWithAnimation() {
  const totalElement = document.getElementById('totalPrice');
  totalElement.classList.add('price-update-animation');
  
  const total = Object.keys(quantities).reduce((sum, product) => {
    return sum + quantities[product] * productPrices[product];
  }, 0);
  
  totalElement.textContent = total.toFixed(2);
  
  setTimeout(() => {
    totalElement.classList.remove('price-update-animation');
  }, 500);
}