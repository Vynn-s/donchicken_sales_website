// Initialize user info and datetime
function initializeUserInfo() {
    // Get user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {
        firstName: 'Jervin',
        lastName: 'Andoy',
        email: 'jervin@admin.com'
    };

    // Update profile information
    document.getElementById('userFullName').textContent = `${userInfo.firstName} ${userInfo.lastName}`;
    document.getElementById('userEmail').textContent = userInfo.email;
    document.getElementById('currentUser').textContent = `Welcome, ${userInfo.firstName}`;
}

// Update datetime display
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

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('ri-eye-line');
            icon.classList.add('ri-eye-off-line');
        } else {
            input.type = 'password';
            icon.classList.remove('ri-eye-off-line');
            icon.classList.add('ri-eye-line');
        }
    });
});

// Handle password form submission
document.getElementById('passwordForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Basic validation
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long!');
        return;
    }

    try {
        // Verify current password first
        const verifyResponse = await fetch('http://localhost:3000/verify-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: document.getElementById('userEmail').textContent,
                password: currentPassword
            })
        });

        if (!verifyResponse.ok) {
            throw new Error('Current password is incorrect');
        }

        // If verification successful, update password
        const updateResponse = await fetch('http://localhost:3000/update-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: document.getElementById('userEmail').textContent,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        if (updateResponse.ok) {
            // Show success modal
            const successModal = document.getElementById('successModal');
            successModal.style.display = 'flex';
            
            // Reset form
            this.reset();
            
            // Hide modal after 3 seconds
            setTimeout(() => {
                successModal.style.display = 'none';
            }, 3000);
        } else {
            throw new Error('Failed to update password');
        }
    } catch (error) {
        alert(error.message);
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
        try {
            // Clear local storage
            localStorage.clear();
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    }
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUserInfo();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        icon.classList.remove('ri-moon-line');
        icon.classList.add('ri-sun-line');
    }
});