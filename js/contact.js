/*
 * CONTACT FORM — EMAILJS + FIREBASE INTEGRATION
 */
import { db, collection, addDoc, serverTimestamp } from './firebase-config.js';

(function() {
    // Initialise EmailJS with Public Key
    if (typeof emailjs !== 'undefined') {
        emailjs.init('1f0OHlEQ6aegRMz2C');
    }

    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    // Validation structure
    const fields = ['f-name', 'f-email', 'f-phone', 'f-city', 'f-message'];
    
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
        const email = document.getElementById('f-email').value.trim();
        const phone = document.getElementById('f-phone').value.trim();
        const city = document.getElementById('f-city').value.trim();
        const message = document.getElementById('f-message').value.trim();
        const company = document.getElementById('f-company').value.trim();
        const type = document.getElementById('f-type').value;
        const product = document.getElementById('f-product').value;

        // Validation
        if (!name) { showError('f-name', 'Name is required'); isValid = false; }
        if (!email) { showError('f-email', 'Email is required'); isValid = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('f-email', 'Enter a valid email'); isValid = false; }
        if (!phone) { showError('f-phone', 'Phone is required'); isValid = false; }
        if (!city) { showError('f-city', 'City is required'); isValid = false; }
        if (!message) { showError('f-message', 'Message is required'); isValid = false; }
        else if (message.length < 10) { showError('f-message', 'Min 10 characters required'); isValid = false; }

        if (!isValid) return;

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending... <i class="bx bx-loader-alt bx-spin"></i></span>';

        const templateParams = {
          name: name,
          company: company,
          email: email,
          phone: phone,
          city: city,
          enquiry_type: type,
          product_interest: product,
          message: message,
          time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        const firebaseData = {
          name,
          company,
          email,
          phone,
          city,
          enquiryType: type,
          productInterest: product,
          message,
          timestamp: serverTimestamp(),
          formType: 'contact_page',
          status: 'new'
        };

        try {
            // 1. Send Email (EmailJS)
            if (typeof emailjs !== 'undefined') {
                await emailjs.send('service_jniflqr', 'template_78x6aoq', templateParams);
            }

            // 2. Save to Firebase (Backup/Admin)
            await addDoc(collection(db, "contacts"), firebaseData);
            
            // Success State
            submitBtn.style.display = 'none';
            document.getElementById('formSuccess').style.display = 'block';
            document.getElementById('formSuccess').scrollIntoView({ behavior:'smooth', block:'center' });
        } catch (error) {
            console.error('Submission Error:', error);
            const globalError = document.createElement('p');
            globalError.className = 'error-msg';
            globalError.style.color = 'var(--clay)';
            globalError.style.fontSize = '12px';
            globalError.style.marginTop = '12px';
            globalError.textContent = 'Failed to send message. Please try again or email us directly.';
            submitBtn.parentElement.appendChild(globalError);
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
})();
