// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  themeToggle.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
});

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form elements
  const submitButton = e.target.querySelector('button');
  const messageDiv = document.getElementById('loginMessage');
  
  // Get form data
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Basic validation
  if (!email || !password) {
    messageDiv.textContent = "Please fill in all fields";
    messageDiv.className = "messageDiv error";
    return;
  }

  // Show loading state
  submitButton.disabled = true;
  submitButton.classList.add('loading');
  messageDiv.textContent = "Logging in...";
  messageDiv.className = "messageDiv";

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Store user data in localStorage
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      localStorage.setItem('userId', data.adminId);

      messageDiv.textContent = "Login successful!";
      messageDiv.className = "messageDiv success";

      // Redirect to home page after 1 second
      setTimeout(() => {
        window.location.href = "pages/home.html";
      }, 1000);
    } else {
      messageDiv.textContent = data.message || "Invalid email or password";
      messageDiv.className = "messageDiv error";
    }
  } catch (error) {
    console.error("Error:", error);
    messageDiv.textContent = "Server error. Please try again later.";
    messageDiv.className = "messageDiv error";
  } finally {
    // Remove loading state
    submitButton.disabled = false;
    submitButton.classList.remove('loading');
  }
});