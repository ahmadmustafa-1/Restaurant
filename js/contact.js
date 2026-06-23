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
        let isSubmitting = false;
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (isSubmitting) return;

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

            isSubmitting = true;

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
                    const response = await fetch('https://celestia-api-46e5.onrender.com/api/reservations', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error("API post error");
                    console.log("Reservation persisted in backend API database.");
                    return true;
                } catch (err) {
                    console.warn("Backend API offline.", err);
                    return false;
                }
            }

            // Execute the submit operation
            submitReservation().then((isSuccess) => {
                // 1. Show Toast Success or Warning message
                if (toast) {
                    const toastTitle = toast.querySelector('h4');
                    const toastDesc = toast.querySelector('p');
                    const svgPath = toast.querySelector('svg path');

                    if (isSuccess) {
                        toast.classList.remove('warning');
                        if (toastTitle) toastTitle.textContent = "Message Transmitted";
                        if (toastDesc) toastDesc.textContent = "Our concierge will reach out to you within 2 hours.";
                        if (svgPath) svgPath.setAttribute('d', 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z');
                    } else {
                        toast.classList.add('warning');
                        if (toastTitle) toastTitle.textContent = "Server Offline";
                        if (toastDesc) toastDesc.textContent = "Please call +92 321 0909091 to confirm your table booking!";
                        if (svgPath) svgPath.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z');
                    }

                    toast.classList.add('active');
                    // Auto-hide toast after 6 seconds
                    setTimeout(() => {
                        toast.classList.remove('active');
                    }, 6000);
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
                isSubmitting = false;
            });
        });
    }


});
