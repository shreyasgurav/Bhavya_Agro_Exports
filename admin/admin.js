// Simple Admin Panel - Fresh Start
console.log('Admin panel loading...');

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

let db;

// Initialize Firebase
function initializeFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// Login functionality
function setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');
    const loginScreen = document.getElementById('login-screen');
    const adminDashboard = document.getElementById('admin-dashboard');

    console.log('🔧 Setting up login...');

    if (!loginBtn || !usernameInput || !passwordInput) {
        console.error('❌ Login elements not found');
        return;
    }

    // Check if already logged in
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        console.log('✅ User already logged in');
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        initializeAdmin();
        return;
    }

    // Add login button event
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🔥 LOGIN BUTTON CLICKED!');
        console.log('📝 Username:', usernameInput.value);
        console.log('🔑 Password:', passwordInput.value);
        
        if (usernameInput.value === AUTH.user && passwordInput.value === AUTH.pass) {
            console.log('✅ Login successful!');
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginScreen.style.display = 'none';
            adminDashboard.style.display = 'block';
            initializeAdmin();
        } else {
            console.log('❌ Login failed');
            errorMsg.style.display = 'block';
        }
    });
}

// Initialize admin panel
function initializeAdmin() {
    console.log('🚀 Initializing admin panel...');
    loadInbox();
    loadProducts();
    loadCategories();
}

// Navigation
window.showSection = function(section) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section and activate nav button
    document.getElementById(`${section}-section`).style.display = 'block';
    event.target.classList.add('active');
};

// Logout
window.logout = function() {
    console.log('🚪 Logging out...');
    sessionStorage.removeItem('adminLoggedIn');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-msg').style.display = 'none';
};

// Load inbox
function loadInbox() {
    const container = document.getElementById('inbox-container');
    container.innerHTML = '<p>Loading inquiries...</p>';
    
    db.collection("contacts").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        const inquiries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (inquiries.length === 0) {
            container.innerHTML = '<p>No inquiries found.</p>';
            document.getElementById('count-badge').textContent = '0 new inquiries';
            return;
        }
        
        let html = '<table><thead><tr><th>Name</th><th>City</th><th>Phone</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        
        inquiries.forEach(inquiry => {
            const status = (inquiry.status || 'new').toLowerCase();
            const isNew = status === 'new';
            const date = inquiry.timestamp ? inquiry.timestamp.toDate().toLocaleDateString() : '---';
            
            html += `
                <tr>
                    <td>${inquiry.name || 'Anonymous'}</td>
                    <td>${inquiry.city || '---'}</td>
                    <td>${inquiry.phone || '---'}</td>
                    <td><a href="#" onclick="viewMsg('${inquiry.name}', '${inquiry.message}')">View</a></td>
                    <td>${date}</td>
                    <td><span class="status-tag ${isNew ? 'tag-new' : 'tag-done'}">${status.toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn ${isNew ? 'btn-done' : 'btn-reopen'}" onclick="toggleStatus('${inquiry.id}', '${status}')">${isNew ? '✓' : '↩'}</button>
                        <button class="action-btn btn-delete" onclick="deleteInquiry('${inquiry.id}', '${inquiry.name}')">🗑</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        const newCount = inquiries.filter(i => (i.status || 'new').toLowerCase() === 'new').length;
        document.getElementById('count-badge').textContent = `${newCount} new inquiries`;
    });
}

// Load products
function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<p>Loading products...</p>';
    
    db.collection("products").orderBy("name", "asc").onSnapshot((snapshot) => {
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (products.length === 0) {
            container.innerHTML = '<p>No products found.</p>';
            return;
        }
        
        let html = '<table><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        
        products.forEach(product => {
            const status = product.status || 'available';
            const imageHtml = product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : '<div style="width: 50px; height: 50px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>';
            
            html += `
                <tr>
                    <td>${imageHtml}</td>
                    <td>${product.name}</td>
                    <td>${product.category || '---'}</td>
                    <td><a href="#" onclick="viewMsg('${product.name}', '${product.description}')">View</a></td>
                    <td><span class="status-tag ${status === 'available' ? 'tag-new' : 'tag-done'}">${status.toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn btn-delete" onclick="deleteProduct('${product.id}', '${product.name}')">🗑</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    });
}

// Load categories
function loadCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '<p>Loading categories...</p>';
    
    db.collection("categories").orderBy("name", "asc").onSnapshot((snapshot) => {
        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (categories.length === 0) {
            container.innerHTML = '<p>No categories found.</p>';
            return;
        }
        
        let html = '<div class="categories-grid">';
        
        categories.forEach(category => {
            html += `
                <div class="category-card">
                    <h3>${category.name}</h3>
                    <p>${category.description || 'No description'}</p>
                    <div class="category-actions">
                        <button class="action-btn btn-delete" onclick="deleteCategory('${category.id}', '${category.name}')">🗑 Delete</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Update the shared categories file for website sync
        updateCategoriesFile(categories);
        
        // Update category select in product modal
        updateCategorySelect(categories);
    });
}

// Update shared categories file for website sync
async function updateCategoriesFile(categories) {
    try {
        // Fetch current categories from products-service.js
        const response = await fetch('/js/products-service.js');
        const text = await response.text();
        
        // Extract the current products array
        const productsServiceMatch = text.match(/FALLBACK_PRODUCTS\s*=\[([\s\S]*?)\];/s);
        if (productsServiceMatch) {
            const currentProductsText = productsServiceMatch[1];
            const currentProducts = JSON.parse(currentProductsText);
            
            // Get unique categories from current products
            const uniqueCategories = [...new Set(currentProducts.map(p => p.category).filter(Boolean))];
            
            // Add new categories from admin panel
            const adminCategories = categories.map(c => c.name);
            const allCategories = [...new Set([...uniqueCategories, ...adminCategories])];
            
            // Update the products-service.js file
            const updatedContent = text.replace(
                /FALLBACK_PRODUCTS\s*=\[([\s\S]*?)\];/s,
                `FALLBACK_PRODUCTS = [${allCategories.map(cat => 
                    `  { id: "${cat.toLowerCase().replace(/\s+/g, '-')}", name: "${cat}", category: "${cat}", categoryLabel: "${cat}" }`
                ).join(',\n')            }];\n`
            );
            
            // Write back to the file
            const blob = new Blob([updatedContent], { type: 'application/javascript' });
            const newResponse = await fetch('/js/products-service.js', {
                method: 'POST',
                body: blob,
                headers: { 'Content-Type': 'application/javascript' }
            });
            
            if (newResponse.ok) {
                console.log('✅ Categories file updated for website sync');
            } else {
                console.error('❌ Failed to update categories file');
            }
        }
    } catch (error) {
        console.error('❌ Error updating categories file:', error);
    }
}

// Update category select
function updateCategorySelect(categories) {
    const select = document.getElementById('product-category');
    if (!select) return;
    
    // Clear existing options
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// Modal functions
window.openAddProductModal = function() {
    document.getElementById('add-product-modal').style.display = 'flex';
};

window.closeAddProductModal = function() {
    document.getElementById('add-product-modal').style.display = 'none';
    document.getElementById('add-product-form').reset();
};

window.openAddCategoryModal = function() {
    document.getElementById('add-category-modal').style.display = 'flex';
};

window.closeAddCategoryModal = function() {
    document.getElementById('add-category-modal').style.display = 'none';
    document.getElementById('add-category-form').reset();
};

// Form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Add product form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('product-category').value,
                description: document.getElementById('product-description').value,
                image: document.getElementById('product-image').value || '',
                status: document.getElementById('product-status').value,
                createdAt: new Date()
            };
            
            db.collection("products").add(productData)
                .then(() => {
                    closeAddProductModal();
                    alert('Product added successfully!');
                })
                .catch(error => {
                    console.error('Error adding product:', error);
                    alert('Failed to add product. Check console.');
                });
        });
    }
    
    // Add category form
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoryData = {
                name: document.getElementById('category-name').value,
                description: document.getElementById('category-description').value,
                createdAt: new Date()
            };
            
            db.collection("categories").add(categoryData)
                .then(() => {
                    closeAddCategoryModal();
                    alert('Category added successfully!');
                })
                .catch(error => {
                    console.error('Error adding category:', error);
                    alert('Failed to add category. Check console.');
                });
        });
    }
});

// CRUD operations
window.toggleStatus = function(id, currentStatus) {
    const nextStatus = currentStatus === 'new' ? 'done' : 'new';
    db.collection("contacts").doc(id).update({ status: nextStatus });
};

window.deleteInquiry = function(id, name) {
    if (confirm(`Are you sure you want to delete the inquiry from ${name}?`)) {
        db.collection("contacts").doc(id).delete();
    }
};

window.deleteProduct = function(id, name) {
    if (confirm(`Are you sure you want to delete the product "${name}"?`)) {
        db.collection("products").doc(id).delete();
    }
};

window.deleteCategory = function(id, name) {
    if (confirm(`Are you sure you want to delete the category "${name}"? This will also delete all products in this category.`)) {
        // First delete all products in this category
        db.collection("products").where('category', '==', name).get()
            .then(snapshot => {
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            })
            .then(() => {
                // Then delete the category
                return db.collection("categories").doc(id).delete();
            });
    }
};

// Message viewer
window.viewMsg = function(name, text) {
    document.getElementById('msg-sender-name').textContent = "From: " + (name || 'Anonymous');
    document.getElementById('msg-full-text').textContent = text || 'No message content.';
    document.getElementById('msg-overlay').style.display = 'flex';
};

window.closeMsg = function() {
    document.getElementById('msg-overlay').style.display = 'none';
};

// Initialize when page loads
window.addEventListener('load', function() {
    console.log('📄 Page fully loaded');
    
    // Wait for Firebase to be ready
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            if (initializeFirebase()) {
                setupLogin();
            }
        } else {
            console.error('❌ Firebase not loaded');
            alert('Firebase library not loaded. Please refresh the page.');
        }
    }, 1000);
});
