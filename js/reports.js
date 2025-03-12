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
  updateChartsTheme(isDarkMode);
});

// Data handling
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allSalesData = [];

// Format currency
function formatCurrency(amount) {
  return '₱' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Format date
function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return new Date(dateString).toLocaleString('en-US', options);
}

// Initialize pie chart
let pieChart;
function initializeChart() {
  const isDarkMode = body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#fff' : '#666';

  const ctx = document.getElementById('categoryPieChart').getContext('2d');
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#32CD32',
          '#BA55D3'
        ],
        borderColor: isDarkMode ? '#222' : '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Update custom legend
function updateCustomLegend(data, total) {
  const legendContainer = document.getElementById('customLegend');
  legendContainer.innerHTML = '';

  data.forEach((item, index) => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color" style="background-color: ${pieChart.data.datasets[0].backgroundColor[index]}"></div>
      <div class="legend-label">
        <span>${item.category}</span>
        <span class="legend-value">${formatCurrency(item.value)} (${percentage}%)</span>
      </div>
    `;
    legendContainer.appendChild(legendItem);
  });

  // Update total sales amount
  document.getElementById('totalSalesAmount').textContent = formatCurrency(total);
}

// Fetch and display data
async function fetchSalesData() {
  try {
    const response = await fetch('http://localhost:3000/sales-reports');
    const data = await response.json();
    allSalesData = data.sales;

    // Process data for pie chart
    const categoryData = {};
    let total = 0;

    data.sales.forEach(sale => {
      if (!categoryData[sale.category]) {
        categoryData[sale.category] = 0;
      }
      categoryData[sale.category] += sale.total_price;
      total += sale.total_price;
    });

    const chartData = Object.entries(categoryData).map(([category, value]) => ({
      category,
      value
    })).sort((a, b) => b.value - a.value); // Sort by value descending

    // Update pie chart
    pieChart.data.labels = chartData.map(item => item.category);
    pieChart.data.datasets[0].data = chartData.map(item => item.value);
    pieChart.update();

    // Update legend and total
    updateCustomLegend(chartData, total);
    filterAndDisplayData();
  } catch (error) {
    console.error('Error fetching sales data:', error);
    document.getElementById('salesLogTable').innerHTML = 
      '<tr><td colspan="7" class="loading-message">Error loading sales data</td></tr>';
  }
}

// Filter and display data
function filterAndDisplayData() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const dateFilter = document.getElementById('dateFilter').value;

  filteredData = allSalesData.filter(sale => {
    const matchesSearch = sale.name.toLowerCase().includes(searchTerm) ||
                         sale.category.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || sale.category === categoryFilter;
    
    // Date filtering
    const saleDate = new Date(sale.timestamp);
    const now = new Date();
    let matchesDate = true;

    if (dateFilter === 'today') {
      matchesDate = saleDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      matchesDate = saleDate >= weekAgo;
    } else if (dateFilter === 'month') {
      matchesDate = saleDate.getMonth() === now.getMonth() &&
                   saleDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'year') {
      matchesDate = saleDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  updatePagination();
  displayCurrentPage();
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Display current page
function displayCurrentPage() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  const tableBody = document.getElementById('salesLogTable');
  tableBody.innerHTML = pageData.map(sale => `
    <tr>
      <td>${sale.id}</td>
      <td>${formatDate(sale.timestamp)}</td>
      <td>${sale.name}</td>
      <td>${sale.category}</td>
      <td>${sale.quantity}</td>
      <td>${formatCurrency(sale.unit_price)}</td>
      <td>${formatCurrency(sale.total_price)}</td>
    </tr>
  `).join('');
}

// Update chart theme
function updateChartsTheme(isDarkMode) {
  const textColor = isDarkMode ? '#fff' : '#666';
  pieChart.options.plugins.legend.labels.color = textColor;
  pieChart.data.datasets[0].borderColor = isDarkMode ? '#222' : '#fff';
  pieChart.update();
}

// Event Listeners
document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 1;
  filterAndDisplayData();
});

document.getElementById('categoryFilter').addEventListener('change', () => {
  currentPage = 1;
  filterAndDisplayData();
});

document.getElementById('dateFilter').addEventListener('change', () => {
  currentPage = 1;
  filterAndDisplayData();
});

document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    displayCurrentPage();
    updatePagination();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayCurrentPage();
    updatePagination();
  }
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const headers = ['ID', 'Date & Time', 'Product', 'Category', 'Quantity', 'Unit Price', 'Total'];
  const csvData = [headers];

  filteredData.forEach(sale => {
    csvData.push([
      sale.id,
      formatDate(sale.timestamp),
      sale.name,
      sale.category,
      sale.quantity,
      sale.unit_price,
      sale.total_price
    ]);
  });

  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'sales_report.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Initialize chart and load data
initializeChart();
fetchSalesData();

// Update user display
const userName = localStorage.getItem('userName') || 'Vynn-s';
document.getElementById('userLogin').textContent = `Welcome, ${userName}`;

// Add this to your reports.js

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle.addEventListener('click', () => {
  mainNav.classList.toggle('active');
  
  // Update icon
  const icon = menuToggle.querySelector('i');
  if (mainNav.classList.contains('active')) {
    icon.classList.remove('ri-menu-line');
    icon.classList.add('ri-close-line');
  } else {
    icon.classList.remove('ri-close-line');
    icon.classList.add('ri-menu-line');
  }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  if (!menuToggle.contains(e.target) && !mainNav.contains(e.target)) {
    mainNav.classList.remove('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.remove('ri-close-line');
    icon.classList.add('ri-menu-line');
  }
});

// Close mobile menu when clicking on a link
mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.remove('ri-close-line');
    icon.classList.add('ri-menu-line');
  });
});

// Close mobile menu on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    mainNav.classList.remove('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.remove('ri-close-line');
    icon.classList.add('ri-menu-line');
  }
});