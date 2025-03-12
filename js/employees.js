const passwordModal = document.getElementById('passwordModal');
const passwordVerificationForm = document.getElementById('passwordVerificationForm');
const formMessage = passwordModal.querySelector('.form-message');
let employeeToDelete = null;

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  body.classList.add(savedTheme);
  themeToggle.textContent = savedTheme === 'dark-mode' ? '🌞' : '🌙';
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDarkMode = body.classList.contains('dark-mode');
  themeToggle.textContent = isDarkMode ? '🌞' : '🌙';
  localStorage.setItem('theme', isDarkMode ? 'dark-mode' : 'light-mode');
});

// Mobile menu toggle
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

// Employee Management
const modal = document.getElementById('employeeModal');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const employeeForm = document.getElementById('employeeForm');
const employeesGrid = document.querySelector('.employees-grid');

// Show modal
addEmployeeBtn.addEventListener('click', () => {
  employeeForm.reset();
  employeeForm.removeAttribute('data-edit-id');
  document.querySelector('.modal-header h3').textContent = 'Add New Employee';
  document.querySelector('.submit-btn').textContent = 'Add Employee';
  modal.classList.add('active');
});

// Close modal
function closeModal() {
  modal.classList.remove('active');
  employeeForm.reset();
}

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Fetch employees
async function fetchEmployees() {
  try {
    const response = await fetch('http://localhost:3000/employees');
    if (!response.ok) throw new Error('Failed to fetch employees');
    const employees = await response.json();
    displayEmployees(employees);
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error loading employees', 'error');
  }
}

// Display employees
function displayEmployees(employees) {
  employeesGrid.innerHTML = employees.map(employee => `
    <div class="employee-card" data-id="${employee.id}">
      <div class="employee-header">
        <div class="employee-avatar">
          ${employee.firstName[0]}${employee.lastName[0]}
        </div>
        <div class="employee-info">
          <h3>${employee.firstName} ${employee.lastName}</h3>
          <p>${employee.position}</p>
        </div>
      </div>
      <div class="employee-details">
        <div class="detail-item">
          <i class="ri-time-line"></i>
          <span>${employee.shift} Shift</span>
        </div>
        <div class="detail-item">
          <i class="ri-phone-line"></i>
          <span>${employee.phone}</span>
        </div>
      </div>
      <div class="employee-actions">
        <button class="action-btn edit-btn" onclick="editEmployee(${employee.id})">
          <i class="ri-edit-line"></i> Edit
        </button>
        <button class="action-btn delete-btn" onclick="deleteEmployee(${employee.id})">
          <i class="ri-delete-bin-line"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Handle form submission
employeeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    firstName: employeeForm.firstName.value,
    lastName: employeeForm.lastName.value,
    position: employeeForm.position.value,
    shift: employeeForm.shift.value,
    phone: employeeForm.phone.value
  };

  const editId = employeeForm.getAttribute('data-edit-id');
  const url = editId 
    ? `http://localhost:3000/employees/${editId}`
    : 'http://localhost:3000/employees';
  const method = editId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save employee');
    }

    await fetchEmployees();
    closeModal();
    showNotification(
      `Employee ${editId ? 'updated' : 'added'} successfully`,
      'success'
    );
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.message, 'error');
  }
});

// Edit employee
async function editEmployee(id) {
  try {
    const response = await fetch(`http://localhost:3000/employees/${id}`);
    if (!response.ok) throw new Error('Failed to fetch employee details');
    const employee = await response.json();

    employeeForm.firstName.value = employee.firstName;
    employeeForm.lastName.value = employee.lastName;
    employeeForm.position.value = employee.position;
    employeeForm.shift.value = employee.shift;
    employeeForm.phone.value = employee.phone;

    employeeForm.setAttribute('data-edit-id', id);
    document.querySelector('.modal-header h3').textContent = 'Edit Employee';
    document.querySelector('.submit-btn').textContent = 'Update Employee';
    modal.classList.add('active');
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error loading employee details', 'error');
  }
}

// Delete employee
// Update the deleteEmployee function
async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    employeeToDelete = id;
    formMessage.textContent = '';
    formMessage.className = 'form-message';
    passwordVerificationForm.reset();
    passwordModal.classList.add('active');
  }
  
  // Add password verification form handler
  passwordVerificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = passwordVerificationForm.adminPassword.value;
    const userEmail = localStorage.getItem('userEmail');
  
    if (!userEmail) {
      showNotification('Please log in again', 'error');
      return;
    }
    
    try {
      // First verify the admin password
      const verifyResponse = await fetch('http://localhost:3000/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userEmail,
          password: password
        })
      });
  
      const verifyData = await verifyResponse.json();
  
      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || 'Invalid password');
      }
  
      // If password is verified, proceed with deletion
      const deleteResponse = await fetch(`http://localhost:3000/employees/${employeeToDelete}`, {
        method: 'DELETE'
      });
  
      if (!deleteResponse.ok) {
        const deleteData = await deleteResponse.json();
        throw new Error(deleteData.message || 'Failed to delete employee');
      }
  
      // Success - close modal and refresh employee list
      passwordModal.classList.remove('active');
      employeeToDelete = null;
      await fetchEmployees();
      showNotification('Employee deleted successfully', 'success');
  
    } catch (error) {
      // Show error in the form and as notification
      formMessage.textContent = error.message;
      formMessage.className = 'form-message error';
      showNotification(error.message, 'error');
      console.error('Error:', error);
    }
  });

// Add password modal close handlers
passwordModal.querySelector('.close-btn').addEventListener('click', closePasswordModal);
passwordModal.querySelector('.cancel-btn').addEventListener('click', closePasswordModal);
passwordModal.addEventListener('click', (e) => {
  if (e.target === passwordModal) closePasswordModal();
});

function closePasswordModal() {
  passwordModal.classList.remove('active');
  employeeToDelete = null;
  formMessage.textContent = '';
  formMessage.className = 'form-message';
  passwordVerificationForm.reset();
}

// Make sure your showNotification function is defined
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Add console logs for debugging
function debugLog(message, data) {
  console.log(`DEBUG: ${message}`, data);
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Initialize
fetchEmployees();

// Update user display
const userName = localStorage.getItem('userName') || 'Vynn-s';
document.getElementById('userLogin').textContent = `Welcome, ${userName}`;

function updateDateTime() {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
    document.getElementById('currentDateTime').textContent = formatted;
  }
  
  function initializeUserInfo() {
    const userName = localStorage.getItem('userName') || 'Vynn-s';
    document.getElementById('currentUser').textContent = `Current User's Login: ${userName}`;
    updateDateTime();
  }
  
  // Add this to your initialization code
  setInterval(updateDateTime, 1000);
  initializeUserInfo();

// Update the deleteEmployee function
async function deleteEmployee(id) {
  employeeToDelete = id;
  formMessage.textContent = '';
  formMessage.className = 'form-message';
  passwordVerificationForm.reset();
  passwordModal.classList.add('active');
}

// Add password verification form handler
passwordVerificationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const password = passwordVerificationForm.adminPassword.value;
  
  try {
    // First verify the admin password
    const verifyResponse = await fetch('http://localhost:3000/verify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: localStorage.getItem('userEmail'),
        password: password
      })
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(errorData.message || 'Invalid password');
    }

    // If password is verified, proceed with deletion
    const deleteResponse = await fetch(`http://localhost:3000/employees/${employeeToDelete}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete employee');
    }

    // Success - close modal and refresh employee list
    passwordModal.classList.remove('active');
    employeeToDelete = null;
    await fetchEmployees();
    showNotification('Employee deleted successfully', 'success');

  } catch (error) {
    // Show error in the form
    formMessage.textContent = error.message;
    formMessage.className = 'form-message error';
    console.error('Error:', error);
  }
});

// Add password modal close handlers
passwordModal.querySelector('.close-btn').addEventListener('click', closePasswordModal);
passwordModal.querySelector('.cancel-btn').addEventListener('click', closePasswordModal);
passwordModal.addEventListener('click', (e) => {
  if (e.target === passwordModal) closePasswordModal();
});

function closePasswordModal() {
  passwordModal.classList.remove('active');
  employeeToDelete = null;
  formMessage.textContent = '';
  formMessage.className = 'form-message';
  passwordVerificationForm.reset();
}
  
  // Update the initialization code to include current date/time and user
  function updateDateTime() {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
    document.getElementById('currentDateTime').textContent = formatted;
  }
  
  function initializeUserInfo() {
    // Get user info from localStorage (set during login)
    const userName = localStorage.getItem('userName') || 'Vynn-s';
    document.getElementById('currentUser').textContent = userName;
    updateDateTime();
  }
  
  // Add this to your initialization code
  setInterval(updateDateTime, 1000);
  initializeUserInfo();