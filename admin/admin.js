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

let db, storage;

// Initialize Firebase
function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        storage = firebase.storage();
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
        
        // Initialize Firebase if not already done
        if (!db || !storage) {
            initializeFirebase();
        }
        
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
            console.log('🔥 Hiding login screen and showing dashboard...');
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginScreen.style.display = 'none';
            adminDashboard.style.display = 'block';
            console.log('✅ Dashboard should now be visible');
            
            // Initialize Firebase if not already done
            if (!db || !storage) {
                console.log('🔥 Initializing Firebase...');
                initializeFirebase();
            }
            
            console.log('🔥 Initializing admin panel...');
            initializeAdmin();
        } else {
            console.log('❌ Login failed - credentials incorrect');
            console.log('📝 Expected username:', AUTH.user);
            console.log('📝 Expected password:', AUTH.pass);
            console.log('📝 Actual username:', usernameInput.value);
            console.log('📝 Actual password:', passwordInput.value);
            errorMsg.style.display = 'block';
            console.log('✅ Error message should now be visible');
        }
    });
}

// Initialize admin panel
function initializeAdmin() {
    console.log('🚀 Initializing admin panel...');
    
    // Make sure Firebase is initialized before loading data
    if (!db || !storage) {
        console.log('🔥 Firebase not initialized, initializing now...');
        if (!initializeFirebase()) {
            console.error('❌ Firebase initialization failed');
            return;
        }
    }
    
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
            let imageHtml;
            
            if (product.image && product.image !== '') {
                const imgSrc = product.image.startsWith('http') ? product.image : '../' + product.image;
                const hrefSrc = product.image.startsWith('http') ? product.image : '../' + product.image;
                imageHtml = `<div class="product-thumbnail-wrapper">
                    <a href="${hrefSrc}" target="_blank" title="Click to view full image">
                        <img src="${imgSrc}" alt="${product.name}" class="product-thumbnail">
                    </a>
                </div>`;
            } else {
                imageHtml = `<div class="product-placeholder">🖼</div>`;
            }
            
            html += `
                <tr>
                    <td>${imageHtml}</td>
                    <td>${product.name}</td>
                    <td>${product.category || '---'}</td>
                    <td>${product.description ? product.description.substring(0, 100) + '...' : 'No description'}</td>
                    <td><span class="status-tag ${status === 'available' ? 'tag-new' : 'tag-unavailable'}">${status.toUpperCase()}</span></td>
                    <td>
                        <button class="action-btn btn-edit" onclick="editProduct('${product.id}')">✏️</button>
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
        
        // Derive categories from products collection
        db.collection("products").get().then(productsSnapshot => {
            const products = productsSnapshot.docs.map(doc => doc.data());
            const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
            
            let html = '<div class="categories-grid">';
            
            // Add categories from Firestore
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
            
            // Add categories derived from products
            uniqueCategories.forEach(category => {
                if (!categories.some(c => c.name === category.name)) {
                    html += `
                        <div class="category-card">
                            <h3>${category.name}</h3>
                            <p><em>Products in this category: ${products.filter(p => p.category === category.name).length}</em></p>
                            <div class="category-actions">
                                <button class="action-btn" disabled>📊 View Products (${products.filter(p => p.category === category.name).length})</button>
                            </div>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
            container.innerHTML = html;
        });
        
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

// Upload mode toggle
window.setUploadMode = function(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="setUploadMode('${mode}')"]`).classList.add('active');
    
    document.getElementById('file-upload-mode').style.display = mode === 'file' ? 'block' : 'none';
    document.getElementById('url-upload-mode').style.display = mode === 'url' ? 'block' : 'none';
};

// Image upload functionality
function handleImageUpload(file) {
    if (!file) return;
    
    const progressBar = document.querySelector('.progress-bar');
    const progressContainer = document.querySelector('.upload-progress');
    progressContainer.style.display = 'block';
    
    const storageRef = storage.ref();
    const fileName = `${Date.now()}_${file.name}`;
    const uploadTask = storageRef.child(`products/${fileName}`).put(file);
    
    uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.style.width = `${progress}%`;
    });
    
    uploadTask.then((snapshot) => {
        return snapshot.ref.getDownloadURL();
    }).then((downloadURL) => {
        document.getElementById('product-image').value = downloadURL;
        progressContainer.style.display = 'none';
        showToast('Image uploaded successfully!', 'success');
    }).catch((error) => {
        console.error('Upload failed:', error);
        progressContainer.style.display = 'none';
        showToast('Upload failed. Try URL instead.', 'error');
    });
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) {
            container.remove();
        }
    }, 3000);
}

// Edit product functionality
window.editProduct = function(id) {
    db.collection("products").doc(id).get().then((doc) => {
        if (doc.exists) {
            const product = doc.data();
            
            // Pre-fill modal
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-image').value = product.image || '';
            document.getElementById('product-status').value = product.status;
            
            // Change modal to edit mode
            document.querySelector('#add-product-modal h3').textContent = 'Edit Product';
            document.querySelector('#add-product-form button[type="submit"]').textContent = 'Save Changes';
            
            // Store editing state
            window.editingProductId = id;
            
            // Open modal
            openAddProductModal();
        }
    });
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

// Clear product cache for real-time sync
window.clearProductCache = function() {
    console.log('🔄 Clearing product cache for real-time sync...');
    
    // Clear localStorage cache
    localStorage.removeItem('bhavya_products_cache');
    
    // Send message to all windows/tabs to refresh
    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('bhavya-updates');
        channel.postMessage({ type: 'product-updated', timestamp: Date.now() });
        channel.close();
    }
    
    // Also try to notify parent window if in iframe
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'product-updated', timestamp: Date.now() }, '*');
    }
};

// Listen for cache clear messages
if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('bhavya-updates');
    channel.onmessage = function(event) {
        if (event.data.type === 'product-updated') {
            console.log('📡 Received product update notification, refreshing...');
            // Reload products if admin panel is visible
            if (document.getElementById('admin-dashboard').style.display !== 'none') {
                loadProducts();
            }
        }
    };
}

// Listen for messages from iframes
window.addEventListener('message', function(event) {
    if (event.data.type === 'product-updated') {
        console.log('📡 Received product update from iframe, refreshing...');
        if (document.getElementById('admin-dashboard').style.display !== 'none') {
            loadProducts();
        }
    }
});

// Toast notification system
window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.querySelector('.toast-container') || (() => {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    })();
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Modal functions
window.openAddProductModal = function() {
    document.getElementById('add-product-modal').style.display = 'flex';
};

window.closeAddProductModal = function() {
    document.getElementById('add-product-modal').style.display = 'none';
    document.getElementById('add-product-form').reset();
    window.editingProductId = null;
    document.querySelector('#add-product-modal h3').textContent = 'Add Product';
    document.querySelector('#add-product-form button[type="submit"]').textContent = 'Add Product';
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
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('product-category').value,
                description: document.getElementById('product-description').value,
                image: document.getElementById('product-image').value || '',
                status: document.getElementById('product-status').value,
                createdAt: new Date()
            };
            
            try {
                if (window.editingProductId) {
                    // Update existing product
                    await db.collection("products").doc(window.editingProductId).update(productData);
                    showToast('Product updated successfully!', 'success');
                } else {
                    // Add new product
                    await db.collection("products").add(productData);
                    showToast('Product added successfully!', 'success');
                }
                
                closeAddProductModal();
                
                // Trigger products-service.js cache clear for website sync
                if (typeof clearProductCache === 'function') {
                    clearProductCache();
                }
            } catch (error) {
                console.error('Error saving product:', error);
                showToast('Failed to save product. Check console.', 'error');
            }
        });
    }
    
    // File upload handler
    const fileInput = document.getElementById('product-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }
    
    // Add category form
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const categoryData = {
                name: document.getElementById('category-name').value,
                description: document.getElementById('category-description').value,
                createdAt: new Date()
            };
            
            try {
                await db.collection("categories").add(categoryData);
                closeAddCategoryModal();
                showToast('Category added successfully!', 'success');
                
                // Trigger products-service.js cache clear for website sync
                if (typeof clearProductCache === 'function') {
                    clearProductCache();
                }
            } catch (error) {
                console.error('Error adding category:', error);
                showToast('Failed to add category. Check console.', 'error');
            }
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
        db.collection("products").doc(id).delete().then(() => {
            // Clear cache for real-time sync
            clearProductCache();
            showToast('Product deleted successfully!', 'success');
        }).catch(error => {
            console.error('Error deleting product:', error);
            showToast('Failed to delete product', 'error');
        });
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
            })
            .then(() => {
                // Clear cache for real-time sync
                clearProductCache();
                showToast('Category and associated products deleted successfully!', 'success');
            })
            .catch(error => {
                console.error('Error deleting category:', error);
                showToast('Failed to delete category', 'error');
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
