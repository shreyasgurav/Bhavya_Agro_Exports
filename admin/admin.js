import { db, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from '../js/firebase-config.js';
// Force refresh - v2

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
const inboxPage = document.getElementById('inbox-page');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (usernameInput.value === AUTH.user && passwordInput.value === AUTH.pass) {
            loginScreen.style.display = 'none';
            inboxPage.style.display = 'block';
            initRealtimeInbox();
        } else {
            errorMsg.style.display = 'block';
        }
    });
}

// Inbox Functionality
let inquiries = [];

function initRealtimeInbox() {
    const q = query(collection(db, "contacts"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        inquiries = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        renderTable();
    }, (error) => {
        console.error("Firestore Listen Error:", error);
    });
}

function renderTable() {
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
