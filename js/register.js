// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA37k9DMwHZjnmzehLPy6Sg0sTNmfhh73U",
  authDomain: "sales-management-system-f26ff.firebaseapp.com",
  projectId: "sales-management-system-f26ff",
  storageBucket: "sales-management-system-f26ff.appspot.com", // Fixed storage bucket
  messagingSenderId: "287499453046",
  appId: "1:287499453046:web:d51faeacb3ae7076531557",
  measurementId: "G-DEZZ8KKWS6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Form submission event listener
const form = document.getElementById("auth-form");
form.addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get user input
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    // Firebase authentication
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("Account created successfully!");
            window.location.href = "home.html"; // Redirect
        })
        .catch((error) => {
            alert(`Error: ${error.message}`);
        });
});
