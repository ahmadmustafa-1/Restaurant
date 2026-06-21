document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const nameInput = document.getElementById('form-name');
    const emailInput = document.getElementById('form-email');
    const subjectInput = document.getElementById('form-subject');
    const messageInput = document.getElementById('form-message');
    const submitBtn = document.getElementById('form-submit-btn');
    const toast = document.getElementById('toast-success');

    // Validation configuration parameters
    const validators = {
        name: {
            element: nameInput,
            isValid: (val) => val.trim().length >= 3,
            errorMsg: "Name must be at least 3 characters long."
        },
        email: {
            element: emailInput,
            isValid: (val) => {
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return regex.test(val.trim());
            },
            errorMsg: "Please enter a valid email address."
        },
        subject: {
            element: subjectInput,
            isValid: (val) => val.trim().length >= 5,
            errorMsg: "Subject must be at least 5 characters long."
        },
        message: {
            element: messageInput,
            isValid: (val) => val.trim().length >= 15,
            errorMsg: "Message must be at least 15 characters long."
        }
    };

    // Inline validation checker helper
    function validateField(fieldName, isFirstTouch = false) {
        const rules = validators[fieldName];
        if (!rules || !rules.element) return false;

        const value = rules.element.value;
        const valid = rules.isValid(value);
        const errorMsgElement = rules.element.parentElement.querySelector('.error-msg');

        // If it's a first touch, don't show invalid error, wait for blur
        if (isFirstTouch) {
            if (valid) {
                rules.element.classList.add('is-valid');
                rules.element.classList.remove('is-invalid');
            } else {
                rules.element.classList.remove('is-valid');
            }
            return valid;
        }

        if (valid) {
            rules.element.classList.add('is-valid');
            rules.element.classList.remove('is-invalid');
            if (errorMsgElement) errorMsgElement.textContent = '';
        } else {
            rules.element.classList.add('is-invalid');
            rules.element.classList.remove('is-valid');
            if (errorMsgElement) errorMsgElement.textContent = rules.errorMsg;
        }

        return valid;
    }

    // Attach real-time input event listeners
    Object.keys(validators).forEach(key => {
        const rules = validators[key];
        if (!rules.element) return;

        // On typing - perform soft checks
        rules.element.addEventListener('input', () => {
            // If the field has already been validated (i.e. has validity classes), update live
            if (rules.element.classList.contains('is-invalid') || rules.element.classList.contains('is-valid')) {
                validateField(key, false);
            } else {
                validateField(key, true);
            }
        });

        // On blur - perform full validation check (since user is moving away)
        rules.element.addEventListener('blur', () => {
            validateField(key, false);
        });
    });

    // Form submission event listener
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Perform manual check on all keys
            let formValid = true;
            Object.keys(validators).forEach(key => {
                const isValid = validateField(key, false);
                if (!isValid) formValid = false;
            });

            if (!formValid) {
                // Focus the first invalid element
                const firstInvalid = contactForm.querySelector('.is-invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // If form is valid - trigger button loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite; margin-right: 10px;">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10"></path>
                </svg>
                <span>Sending...</span>
            `;

            // Style spinner in-file dynamic style addition
            const style = document.createElement('style');
            style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);

            // Capture reservation payload
            const payload = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                subject: subjectInput.value.trim(),
                message: messageInput.value.trim()
            };

            // Dynamic function to submit
            async function submitReservation() {
                try {
                    const response = await fetch('https://celestia-api-46o5.onrender.com/api/reservations', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error("API post error");
                    console.log("Reservation persisted in backend API database.");
                } catch (err) {
                    console.warn("Backend API offline. Falling back to local persistence.", err);
                    
                    // Fallback to localStorage
                    const reservationData = {
                        id: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        name: payload.name,
                        email: payload.email,
                        subject: payload.subject,
                        message: payload.message,
                        date: new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        status: 'Pending'
                    };

                    const existing = JSON.parse(localStorage.getItem('celestia_reservations')) || [];
                    existing.unshift(reservationData);
                    localStorage.setItem('celestia_reservations', JSON.stringify(existing));
                }
            }

            // Execute the submit operation
            submitReservation().then(() => {
                // 1. Show Toast Success message
                if (toast) {
                    toast.classList.add('active');
                    // Auto-hide toast after 4.5 seconds
                    setTimeout(() => {
                        toast.classList.remove('active');
                    }, 4500);
                }

                // 2. Clear input elements & remove validity styling
                contactForm.reset();
                Object.keys(validators).forEach(key => {
                    const el = validators[key].element;
                    if (el) {
                        el.classList.remove('is-valid', 'is-invalid');
                    }
                });

                // 3. Reset Button State
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.innerHTML = originalBtnText;
            });
        });
    }


});
