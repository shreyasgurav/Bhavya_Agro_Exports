/*
 * EMAILJS SETUP — COMPLETE BEFORE GOING LIVE:
 * 1. Go to https://emailjs.com and sign up free
 * 2. Add Gmail service → copy Service ID → replace YOUR_SERVICE_ID
 * 3. Create email template → copy Template ID → replace YOUR_TEMPLATE_ID
 * 4. Account → Public Key → replace YOUR_PUBLIC_KEY
 * Template variables: {{from_name}}, {{company}}, {{email}}, {{phone}}, {{city}}, {{enquiry_type}}, {{product_interest}}, {{message}}
 */

(function() {
    // Initialise EmailJS with Public Key
    emailjs.init('1f0OHlEQ6aegRMz2C');

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
    
    // Override the inline onclick from HTML
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

        const form = contactForm;
        const templateParams = {
          name: form.querySelector('[name="name"]').value,
          company: form.querySelector('[name="company"]').value,
          email: form.querySelector('[name="email"]').value,
          phone: form.querySelector('[name="phone"]').value,
          city: form.querySelector('[name="city"]').value,
          enquiry_type: form.querySelector('[name="enquiry_type"]').value,
          product_interest: form.querySelector('[name="product_interest"]').value,
          message: form.querySelector('[name="message"]').value,
          time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        try {
            // Un-comment after putting actual keys
            await emailjs.send('service_jniflqr', 'template_78x6aoq', templateParams);
            
            // Success State
            submitBtn.style.display = 'none';
            document.getElementById('formSuccess').style.display = 'block';
            document.getElementById('formSuccess').scrollIntoView({ behavior:'smooth', block:'center' });
        } catch (error) {
            console.error('EmailJS Error:', error);
            const globalError = document.createElement('p');
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
