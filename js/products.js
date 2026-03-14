/*
 * QUOTE REQUEST MODAL — EMAILJS + FIREBASE INTEGRATION
 */
import { db, collection, addDoc, serverTimestamp } from './firebase-config.js';

const EMAILJS_SERVICE  = 'service_jniflqr';
const EMAILJS_TEMPLATE = 'template_78x6aoq';
const EMAILJS_KEY      = '1f0OHlEQ6aegRMz2C';

// Wait for emailjs to be available (race with classic script tag)
function waitForEmailJS(callback) {
    if (typeof emailjs !== 'undefined') {
        if (!window.emailjsInitialized) {
            emailjs.init(EMAILJS_KEY);
            window.emailjsInitialized = true;
        }
        callback();
    } else {
        setTimeout(() => waitForEmailJS(callback), 100);
    }
}

function init() {
    const quotationForm = document.getElementById('quotationForm');
    if (!quotationForm) return;

    const fields = ['nameField', 'phoneField', 'emailField'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                const errorSpan = el.parentElement.querySelector('.error-msg');
                if (errorSpan) errorSpan.remove();
                el.style.borderColor = '';
            });
        }
    });

    function showFieldError(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.borderColor = 'var(--clay)';
        let span = el.parentElement.querySelector('.error-msg');
        if (!span) {
            span = document.createElement('span');
            span.className = 'error-msg';
            span.style.cssText = 'color:var(--clay);font-size:10px;margin-top:4px;display:block;';
            el.parentElement.appendChild(span);
        }
        span.textContent = msg;
    }

    function clearGlobalError(btn) {
        // Remove any stale global error messages
        quotationForm.querySelectorAll('.global-error-msg').forEach(e => e.remove());
    }

    function showGlobalError(btn, msg) {
        clearGlobalError(btn);
        const p = document.createElement('p');
        p.className = 'global-error-msg';
        p.style.cssText = 'color:var(--clay);font-size:12px;margin-top:12px;text-align:center;';
        p.textContent = msg;
        btn.parentElement.appendChild(p);
    }

    quotationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name    = document.getElementById('nameField').value.trim();
        const phone   = document.getElementById('phoneField').value.trim();
        const email   = document.getElementById('emailField').value.trim();
        const product = document.getElementById('productField').value;
        const company = document.getElementById('companyField').value.trim();
        const city    = document.getElementById('cityField').value.trim();
        const message = document.getElementById('messageField').value.trim();

        let isValid = true;
        if (!name)  { showFieldError('nameField',  'Name is required');           isValid = false; }
        if (!phone) { showFieldError('phoneField', 'Contact number is required'); isValid = false; }
        if (!email) { showFieldError('emailField', 'Email is required');          isValid = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('emailField', 'Enter a valid email'); isValid = false;
        }
        if (!isValid) return;

        const btn = quotationForm.querySelector('.submit-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending...';
        clearGlobalError(btn);

        const templateParams = {
            name,
            company,
            email,
            phone,
            city,
            enquiry_type: 'Quotation Request',
            product_interest: product,
            message: message || 'Please provide pricing for the selected items.',
            time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        const firebaseData = {
            name, phone, email,
            productInterest: product,
            company, city,
            message: message || 'N/A',
            timestamp: serverTimestamp(),
            formType: 'quotation_modal',
            status: 'new'
        };

        try {
            // 1. Send email via EmailJS
            if (typeof emailjs !== 'undefined') {
                await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams);
            }

            // 2. Save backup to Firebase
            await addDoc(collection(db, 'quotations'), firebaseData);

            // 3. Show success UI
            const content = quotationForm.parentElement;
            const originalHTML = content.innerHTML;
            if (window.resetSelection) window.resetSelection();

            content.innerHTML = `
                <div style="text-align:center;padding:40px 0;">
                    <i class='bx bx-check-circle' style='font-size:64px;color:var(--gold);margin-bottom:20px;display:block;'></i>
                    <h3 style="font-family:'Cormorant Garamond';font-size:32px;font-weight:300;margin-bottom:12px;">Request Sent</h3>
                    <p style="font-size:14px;color:var(--light-text);line-height:1.6;">Thank you for your interest. We will get back to you with a formal quotation shortly.</p>
                </div>`;

            setTimeout(() => {
                if (window.closeQuotationModal) window.closeQuotationModal();
                setTimeout(() => { content.innerHTML = originalHTML; init(); }, 500);
            }, 3000);

        } catch (error) {
            console.error('Submission Error:', error);
            showGlobalError(btn, 'Failed to send request. Please try again or contact us directly.');
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

// Boot: wait for EmailJS SDK, then initialise form
waitForEmailJS(init);
