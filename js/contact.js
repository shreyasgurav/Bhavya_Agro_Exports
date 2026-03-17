/*
 * CONTACT FORM — EMAILJS + FIREBASE INTEGRATION
 */
import { db, collection, addDoc, serverTimestamp } from './firebase-config.js';

const EMAILJS_SERVICE  = 'service_jniflqr';
const EMAILJS_TEMPLATE = 'template_78x6aoq';
const EMAILJS_KEY      = '1f0OHlEQ6aegRMz2C';

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

(function() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    waitForEmailJS(() => {});  // pre-warm EmailJS as early as possible

    // Validation structure
    const fields = ['f-name', 'f-phone', 'f-city', 'f-message'];
    
    // Clear errors on input
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

    function showError(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.borderColor = 'var(--clay)';
        let errorSpan = el.parentElement.querySelector('.error-msg');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-msg';
            errorSpan.style.color = 'var(--clay)';
            errorSpan.style.fontSize = '10px';
            errorSpan.style.marginTop = '4px';
            errorSpan.style.display = 'block';
            el.parentElement.appendChild(errorSpan);
        }
        errorSpan.textContent = msg;
    }

    const submitBtn = document.getElementById('submitBtn');
    
    // Override the inline onclick or define globally
    window.handleSubmit = async function() {
        let isValid = true;
        const name = document.getElementById('f-name').value.trim();
        const city = document.getElementById('f-city').value.trim();
        const phone = document.getElementById('f-phone').value.trim();
        const message = document.getElementById('f-message').value.trim();

        // Validation
        if (!name) { showError('f-name', 'Name is required'); isValid = false; }
        if (!city) { showError('f-city', 'City is required'); isValid = false; }
        if (!phone) { showError('f-phone', 'Phone is required'); isValid = false; }
        if (!message) { showError('f-message', 'Message is required'); isValid = false; }
        else if (message.length < 10) { showError('f-message', 'Min 10 characters required'); isValid = false; }

        if (!isValid) return;

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending... <i class="bx bx-loader-alt bx-spin"></i></span>';

        const templateParams = {
          name: name,
          phone: phone,
          city: city,
          message: message,
          time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        const firebaseData = {
          name,
          phone,
          city,
          message,
          timestamp: serverTimestamp(),
          formType: 'contact_page',
          status: 'new'
        };

        try {
            // 1. Save to Firebase FIRST — source of truth
            await addDoc(collection(db, "contacts"), firebaseData);

            // 2. Try to email — non-blocking, failure is silent
            if (typeof emailjs !== 'undefined') {
                emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams)
                    .catch(err => console.warn('EmailJS non-critical:', err));
            }

            // Success State
            submitBtn.style.display = 'none';
            document.getElementById('formSuccess').style.display = 'block';
            document.getElementById('formSuccess').scrollIntoView({ behavior:'smooth', block:'center' });
        } catch (error) {
            console.error('Submission Error:', error);
            // Remove old error if present
            submitBtn.parentElement.querySelectorAll('.global-error-msg').forEach(e => e.remove());
            const globalError = document.createElement('p');
            globalError.className = 'global-error-msg';
            globalError.style.cssText = 'color:var(--clay);font-size:12px;margin-top:12px;';
            globalError.textContent = 'Database error: Please ensure Firestore is initialized in your console.';
            submitBtn.parentElement.appendChild(globalError);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
})();
