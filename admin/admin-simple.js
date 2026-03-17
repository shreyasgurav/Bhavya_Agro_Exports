// Simplified admin.js for debugging
console.log('Admin.js loaded');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDgkJZA6BpTYLoCfVFdcvHbLzp6D_0bU4",
    authDomain: "bhavya-agro-d3407.firebaseapp.com",
    projectId: "bhavya-agro-d3407",
    storageBucket: "bhavya-agro-d3407.firebasestorage.app",
    messagingSenderId: "701815969630",
    appId: "1:701815969630:web:d38ef87a8204b72f2f61cf",
    measurementId: "G-GMV0NN4VKR"
};

// Login credentials
const AUTH = {
    user: "omkar",
    pass: "bhavya123"
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Wait for Firebase to load
    setTimeout(function() {
        if (typeof firebase !== 'undefined') {
            console.log('Firebase available, initializing...');
            try {
                firebase.initializeApp(firebaseConfig);
                window.db = firebase.firestore();
                console.log('Firebase initialized successfully');
                setupLogin();
            } catch (error) {
                console.error('Firebase initialization error:', error);
                alert('Firebase initialization failed: ' + error.message);
            }
        } else {
            console.error('Firebase not available');
            alert('Firebase library not loaded');
        }
    }, 1000);
});

function setupLogin() {
    console.log('Setting up login...');
    
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');
    const loginScreen = document.getElementById('login-screen');
    const adminDashboard = document.getElementById('admin-dashboard');

    console.log('Login elements found:', {
        loginBtn: !!loginBtn,
        usernameInput: !!usernameInput,
        passwordInput: !!passwordInput,
        errorMsg: !!errorMsg,
        loginScreen: !!loginScreen,
        adminDashboard: !!adminDashboard
    });

    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            console.log('Login button clicked!');
            console.log('Username value:', usernameInput.value);
            console.log('Password value:', passwordInput.value);
            console.log('Expected user:', AUTH.user);
            console.log('Expected pass:', AUTH.pass);
            
            const isCorrect = usernameInput.value === AUTH.user && passwordInput.value === AUTH.pass;
            console.log('Login correct?', isCorrect);
            
            if (isCorrect) {
                console.log('Login successful - showing dashboard');
                sessionStorage.setItem('adminLoggedIn', 'true');
                loginScreen.style.display = 'none';
                adminDashboard.style.display = 'block';
                alert('Login successful!');
            } else {
                console.log('Login failed - showing error');
                errorMsg.style.display = 'block';
            }
        });
    } else {
        console.error('Login button not found!');
    }

    // Check if already logged in
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        console.log('User already logged in');
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        return;
    }
}

// Logout function
window.logout = function() {
    console.log('Logout called');
    sessionStorage.removeItem('adminLoggedIn');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-msg').style.display = 'none';
};
