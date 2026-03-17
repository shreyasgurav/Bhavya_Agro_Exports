import { db, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, getDocs, setDoc } from '../js/firebase-config.js';
// Force refresh - v4

// HARDCODED CREDENTIALS (for demonstration)
const AUTH = {
    user: "omkar",
    pass: "bhavya123"
};

// LOGIN LOGIC
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        initializeAdmin();
    }
}

// Call checkLoginStatus on page load
checkLoginStatus();

// Logout function
window.logout = function() {
    sessionStorage.removeItem('adminLoggedIn');
    loginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
    errorMsg.style.display = 'none';
};

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (usernameInput.value === AUTH.user && passwordInput.value === AUTH.pass) {
            // Save login state to session storage
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginScreen.style.display = 'none';
            adminDashboard.style.display = 'block';
            initializeAdmin();
        } else {
            errorMsg.style.display = 'block';
        }
    });
}

// Initialize admin panel
function initializeAdmin() {
    initRealtimeInbox();
    initProducts();
    initCategories();
}

// NAVIGATION
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
}

// INBOX FUNCTIONALITY
let inquiries = [];

function initRealtimeInbox() {
    const q = query(collection(db, "contacts"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        inquiries = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        renderInboxTable();
    }, (error) => {
        console.error("Firestore Listen Error:", error);
    });
}

function renderInboxTable() {
    const tbody = document.getElementById('inbox-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    let newCount = 0;

    if (inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--grey);">No inquiries found.</td></tr>';
        document.getElementById('count-badge').textContent = `0 new inquiries`;
        return;
    }

    inquiries.forEach(item => {
        const status = (item.status || 'new').toLowerCase();
        const isNew = status === "new";
        if (isNew) newCount++;

        const tr = document.createElement('tr');
        tr.className = isNew ? 'row-new' : 'row-done';
        
        // Format Date
        let dateStr = '---';
        if (item.timestamp) {
            const d = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
            dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        tr.innerHTML = `
            <td data-label="Name" style="font-weight: 700;">${item.name || 'Anonymous'}</td>
            <td data-label="City">${item.city || '---'}</td>
            <td data-label="Phone" style="font-family: 'DM Sans'; font-size: 13px;">${item.phone || '---'}</td>
            <td data-label="Message" class="msg-cell">${item.message || 'No message'}</td>
            <td data-label="Date" style="color: #888; font-size: 12px;">${dateStr}</td>
            <td data-label="Status"><span class="status-tag ${isNew ? 'tag-new' : 'tag-done'}">${status.toUpperCase()}</span></td>
            <td data-label="Action">
                <button class="action-btn ${isNew ? 'btn-done' : 'btn-reopen'}" data-id="${item.id}" data-current="${status}">
                    ${isNew ? '✓' : '↩'}
                </button>
                <button class="action-btn btn-delete" data-id="${item.id}" onclick="confirmDelete('${item.id}', '${(item.name || 'Anonymous').replace(/'/g, "\\'")}')">
                    🗑
                </button>
            </td>
        `;

        // Add click listeners for action buttons
        tr.querySelector('.btn-done, .btn-reopen').onclick = () => toggleStatus(item.id, status);

        tbody.appendChild(tr);
    });

    const countBadge = document.getElementById('count-badge');
    if (countBadge) countBadge.textContent = `${newCount} new inquiries`;
}

async function toggleStatus(id, currentStatus) {
    const nextStatus = currentStatus === "new" ? "done" : "new";
    try {
        const docRef = doc(db, "contacts", id);
        await updateDoc(docRef, { status: nextStatus });
    } catch (err) {
        console.error("Error updating status:", err);
        alert("Failed to update status. Check console.");
    }
}

// DELETE FUNCTIONALITY
window.confirmDelete = function(id, name) {
    if (confirm(`Are you sure you want to delete the inquiry from ${name}? This action cannot be undone.`)) {
        deleteInquiry(id);
    }
};

async function deleteInquiry(id) {
    try {
        const docRef = doc(db, "contacts", id);
        await deleteDoc(docRef);
        console.log("Document successfully deleted");
    } catch (err) {
        console.error("Error deleting document:", err);
        alert("Failed to delete inquiry. Check console.");
    }
}

// PRODUCTS FUNCTIONALITY
let products = [];
let categories = [];

function initProducts() {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    
    onSnapshot(q, (snapshot) => {
        products = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        renderProductsTable();
    }, (error) => {
        console.error("Products Listen Error:", error);
    });
}

function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--grey);">No products found.</td></tr>';
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td data-label="Image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : '<div style="width: 50px; height: 50px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>'}
            </td>
            <td data-label="Name" style="font-weight: 700;">${product.name}</td>
            <td data-label="Category">${product.category || '---'}</td>
            <td data-label="Description" class="msg-cell">${product.description ? product.description.substring(0, 100) + '...' : 'No description'}</td>
            <td data-label="Status">
                <span class="status-tag ${product.status === 'available' ? 'tag-new' : 'tag-done'}">
                    ${product.status ? product.status.toUpperCase() : 'AVAILABLE'}
                </span>
            </td>
            <td data-label="Actions">
                <button class="action-btn btn-delete" onclick="confirmDeleteProduct('${product.id}', '${product.name.replace(/'/g, "\\'")}')">
                    🗑
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// CATEGORIES FUNCTIONALITY
function initCategories() {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    
    onSnapshot(q, (snapshot) => {
        categories = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        renderCategoriesGrid();
        updateCategorySelect();
    }, (error) => {
        console.error("Categories Listen Error:", error);
    });
}

function renderCategoriesGrid() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (categories.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--grey);">No categories found.</div>';
        return;
    }

    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        
        categoryCard.innerHTML = `
            <h3>${category.name}</h3>
            <p>${category.description || 'No description'}</p>
            <div class="category-actions">
                <button class="action-btn btn-delete" onclick="confirmDeleteCategory('${category.id}', '${category.name.replace(/'/g, "\\'")}')">
                    🗑 Delete
                </button>
            </div>
        `;

        grid.appendChild(categoryCard);
    });
}

function updateCategorySelect() {
    const select = document.getElementById('product-category');
    if (!select) return;
    
    // Clear existing options except the first one
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

// MODAL FUNCTIONS
window.openAddProductModal = function() {
    document.getElementById('add-product-modal').style.display = 'flex';
    updateCategorySelect(); // Refresh categories in select
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

// FORM SUBMISSIONS
document.addEventListener('DOMContentLoaded', function() {
    // Add Product Form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
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
                await addDoc(collection(db, 'products'), productData);
                closeAddProductModal();
                alert('Product added successfully!');
            } catch (error) {
                console.error('Error adding product:', error);
                alert('Failed to add product. Check console.');
            }
        });
    }
    
    // Add Category Form
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const categoryData = {
                name: document.getElementById('category-name').value,
                description: document.getElementById('category-description').value,
                createdAt: new Date()
            };
            
            try {
                await addDoc(collection(db, 'categories'), categoryData);
                closeAddCategoryModal();
                alert('Category added successfully!');
            } catch (error) {
                console.error('Error adding category:', error);
                alert('Failed to add category. Check console.');
            }
        });
    }
});

// DELETE FUNCTIONS FOR PRODUCTS AND CATEGORIES
window.confirmDeleteProduct = function(id, name) {
    if (confirm(`Are you sure you want to delete the product "${name}"? This action cannot be undone.`)) {
        deleteProduct(id);
    }
};

async function deleteProduct(id) {
    try {
        const docRef = doc(db, "products", id);
        await deleteDoc(docRef);
        console.log("Product successfully deleted");
    } catch (err) {
        console.error("Error deleting product:", err);
        alert("Failed to delete product. Check console.");
    }
}

window.confirmDeleteCategory = function(id, name) {
    if (confirm(`Are you sure you want to delete the category "${name}"? This will also delete all products in this category. This action cannot be undone.`)) {
        deleteCategory(id);
    }
};

async function deleteCategory(id) {
    try {
        // First, delete all products in this category
        const productsInCategory = products.filter(p => p.category === categories.find(c => c.id === id)?.name);
        for (const product of productsInCategory) {
            await deleteDoc(doc(db, "products", product.id));
        }
        
        // Then delete the category
        const docRef = doc(db, "categories", id);
        await deleteDoc(docRef);
        console.log("Category and its products successfully deleted");
    } catch (err) {
        console.error("Error deleting category:", err);
        alert("Failed to delete category. Check console.");
    }
}

// Message Viewer
window.viewMsg = function(name, text) {
    const nameEl = document.getElementById('msg-sender-name');
    const textEl = document.getElementById('msg-full-text');
    const overlay = document.getElementById('msg-overlay');
    
    if (nameEl) nameEl.textContent = "From: " + (name || 'Anonymous');
    if (textEl) textEl.textContent = text || 'No message content.';
    if (overlay) overlay.style.display = 'flex';
}

window.closeMsg = function() {
    const overlay = document.getElementById('msg-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Handle Escape key to close message
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeMsg();
        closeAddProductModal();
        closeAddCategoryModal();
    }
});

// Message Viewer
window.viewMsg = function(name, text) {
    const nameEl = document.getElementById('msg-sender-name');
    const textEl = document.getElementById('msg-full-text');
    const overlay = document.getElementById('msg-overlay');
    
    if (nameEl) nameEl.textContent = "From: " + (name || 'Anonymous');
    if (textEl) textEl.textContent = text || 'No message content.';
    if (overlay) overlay.style.display = 'flex';
}

window.closeMsg = function() {
    const overlay = document.getElementById('msg-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Handle Escape key to close message
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeMsg();
});

// DELETE FUNCTIONALITY
window.confirmDelete = function(id, name) {
    if (confirm(`Are you sure you want to delete the inquiry from ${name}? This action cannot be undone.`)) {
        deleteInquiry(id);
    }
};

async function deleteInquiry(id) {
    try {
        const docRef = doc(db, "contacts", id);
        await deleteDoc(docRef);
        console.log("Document successfully deleted");
    } catch (err) {
        console.error("Error deleting document:", err);
        alert("Failed to delete inquiry. Check console.");
    }
}
