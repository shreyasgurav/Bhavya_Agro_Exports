/*
 * QUOTE REQUEST MODAL — EMAILJS INTEGRATION
 */

(function() {
    // Shared EmailJS Init - Guard against double init
    if (!window.emailjsInitialized) {
        emailjs.init('1f0OHlEQ6aegRMz2C');
        window.emailjsInitialized = true;
    }

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

    quotationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('nameField').value.trim();
        const phone = document.getElementById('phoneField').value.trim();
        const email = document.getElementById('emailField').value.trim();
        const product = document.getElementById('productField').value;
        const company = document.getElementById('companyField').value.trim();
        const city = document.getElementById('cityField').value.trim();
        const message = document.getElementById('messageField').value.trim();

        let isValid = true;
        if (!name) { showError('nameField', 'Name is required'); isValid = false; }
        if (!phone) { showError('phoneField', 'Contact number is required'); isValid = false; }
        if (!email) { showError('emailField', 'Email is required'); isValid = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('emailField', 'Enter a valid email'); isValid = false; }

        if (!isValid) return;

        const btn = quotationForm.querySelector('.submit-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending...';

        const templateParams = {
            name: name,
            company: company,
            email: email,
            phone: phone,
            city: city,
            enquiry_type: 'Quotation Request',
            product_interest: product,
            message: message || 'Please provide pricing for the selected items.',
            time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        try {
            // Un-comment after putting actual keys
            await emailjs.send('service_jniflqr', 'template_78x6aoq', templateParams);
            
            // Success Logic
            const content = quotationForm.parentElement;
            const originalHTML = content.innerHTML;

            // Clear Global Selection State (defined in products.html module)
            if (window.resetSelection) window.resetSelection();
            
            content.innerHTML = `
                <div style="text-align:center; padding: 40px 0;">
                    <i class='bx bx-check-circle' style='font-size: 64px; color: var(--gold); margin-bottom: 20px; display: block;'></i>
                    <h3 style="font-family:'Cormorant Garamond'; font-size: 32px; font-weight: 300; margin-bottom: 12px;">Request Sent</h3>
                    <p style="font-size: 14px; color: var(--light-text); line-height: 1.6;">Thank you for your interest. We will get back to you with a formal quotation shortly.</p>
                </div>
            `;
            
            setTimeout(() => {
                if (window.closeQuotationModal) window.closeQuotationModal();
                // Restore form for next use after a delay
                setTimeout(() => { content.innerHTML = originalHTML; }, 500);
            }, 3000);

        } catch (error) {
            console.error('EmailJS Error:', error);
            const globalError = document.createElement('p');
            globalError.style.color = 'var(--clay)';
            globalError.style.fontSize = '12px';
            globalError.style.marginTop = '12px';
            globalError.textContent = 'Failed to send request. Please try again.';
            btn.parentElement.appendChild(globalError);
            
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
})();
