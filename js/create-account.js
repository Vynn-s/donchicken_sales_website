document.getElementById('createAccountForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form elements
  const submitButton = document.getElementById('signUp');
  const messageDiv = document.getElementById('signUpMessage');
  const form = e.target;

  // Get form data
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Validate inputs
  if (!firstName || !lastName || !email || !password) {
    messageDiv.textContent = "All fields are required";
    messageDiv.className = "messageDiv error";
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    messageDiv.textContent = "Please enter a valid email address";
    messageDiv.className = "messageDiv error";
    return;
  }

  // Password validation (at least 6 characters)
  if (password.length < 6) {
    messageDiv.textContent = "Password must be at least 6 characters long";
    messageDiv.className = "messageDiv error";
    return;
  }

  // Show loading state
  submitButton.disabled = true;
  submitButton.classList.add('loading');
  messageDiv.textContent = "Creating account...";
  messageDiv.className = "messageDiv";

  try {
    const response = await fetch('http://localhost:3000/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = "Account created successfully!";
      messageDiv.className = "messageDiv success";
      form.reset();

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 2000);
    } else {
      messageDiv.textContent = data.message || "Error creating account";
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