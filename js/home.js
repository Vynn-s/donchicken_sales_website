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

// Function to format currency
function formatCurrency(amount) {
  return '₱' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Function to format date
function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Animate number counting
function animateNumber(element, start, end, duration = 1000) {
  const range = end - start;
  const minTimer = 50;
  const stepTime = Math.abs(Math.floor(duration / range));
  const startTime = new Date().getTime();
  const endTime = startTime + duration;
  let timer;

  function run() {
    const now = new Date().getTime();
    const remaining = Math.max((endTime - now) / duration, 0);
    const value = Math.round(end - (remaining * range));
    element.textContent = formatCurrency(value);
    if (value == end) {
      clearInterval(timer);
    }
  }

  timer = setInterval(run, minTimer);
  run();
}

// Function to fetch sales data
async function fetchSalesData() {
  try {
    const response = await fetch('http://localhost:3000/recent-sales?limit=20');
    const data = await response.json();
    
    totalSales = data.totalSales;
    totalOrders = data.totalOrders;

    // Animate the summary numbers
    animateNumber(document.getElementById('totalSalesAmount'), 0, totalSales);
    animateNumber(document.getElementById('totalOrders'), 0, totalOrders);

    return data.sales;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
}

// Update the table function
function updateTable(sales) {
  const tableBody = document.getElementById('recentSalesTable');

  if (sales.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="loading-message">No sales data available</td></tr>';
    return;
  }

  const html = sales.map(sale => `
    <tr>
      <td>${sale.id}</td>
      <td>
        ${sale.timestamp > Date.now() - 3600000 ? '<span class="recent-indicator new"></span>' : ''}
        ${sale.name}
      </td>
      <td>${sale.category}</td>
      <td>${sale.quantity}</td>
      <td>${formatCurrency(sale.unit_price)}</td>
      <td>${formatCurrency(sale.total_price)}</td>
      <td>${formatDate(sale.timestamp)}</td>
    </tr>
  `).join('');

  tableBody.innerHTML = html;
}

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
  const sales = await fetchSalesData();
  updateTable(sales);

  // Refresh data every 30 seconds
  setInterval(async () => {
    const sales = await fetchSalesData();
    updateTable(sales);
  }, 30000);
});

// ScrollReveal Animation
ScrollReveal().reveal('.header__container', { delay: 300, duration: 1000, origin: 'top', distance: '30px' });
ScrollReveal().reveal('.dashboard', { delay: 500, duration: 1000, origin: 'bottom', distance: '30px' });

// Swiper Initialization
const swiper = new Swiper('.swiper', {
  loop: true,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});

// another one 

// Add this to your home.js

// Update date and time
function updateDateTime() {
  const now = new Date();
  const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
  document.getElementById('currentDateTime').textContent = formatted;
}

// Update time every second
setInterval(updateDateTime, 1000);

// Get user info from localStorage
const userEmail = localStorage.getItem('userEmail');
const userName = localStorage.getItem('userName');
if (userName) {
  document.getElementById('userLogin').textContent = `Welcome, ${userName}`;
} else if (userEmail) {
  document.getElementById('userLogin').textContent = `Welcome, ${userEmail}`;
}

// Mobile menu functionality
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

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('active') && 
        !mainNav.contains(e.target) && 
        !menuToggle.contains(e.target)) {
        mainNav.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('ri-close-line');
        icon.classList.add('ri-menu-line');
    }
});

// Update datetime
function updateDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    document.getElementById('currentDateTime').textContent = formatted;
}

// Initialize user info
function initializeUserInfo() {
    const userName = localStorage.getItem('userName') || 'Vynn-s';
    document.getElementById('currentUser').textContent = `Welcome, ${userName}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUserInfo();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        icon.classList.remove('ri-moon-line');
        icon.classList.add('ri-sun-line');
    }
});

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#themeToggle i');
    
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('ri-moon-line');
        icon.classList.add('ri-sun-line');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.remove('ri-sun-line');
        icon.classList.add('ri-moon-line');
        localStorage.setItem('theme', 'light');
    }
});