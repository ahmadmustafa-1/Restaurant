document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const emptyState = document.getElementById('empty-state');
    const activeView = document.getElementById('checkout-active-view');
    const cartItemsList = document.getElementById('checkout-cart-items-list');
    
    // Pricing Breakdown Elements
    const receiptSubtotal = document.getElementById('receipt-subtotal');
    const receiptTotal = document.getElementById('receipt-total');
    
    // Forms & Payment Panels
    const checkoutForm = document.getElementById('checkout-order-form');
    const paymentCards = document.querySelectorAll('.payment-card');
    const panelCardFields = document.getElementById('panel-card-fields');
    const panelWalletFields = document.getElementById('panel-wallet-fields');
    
    // Payment inputs
    const cardNumInput = document.getElementById('card-num');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-cvv');
    const walletNumInput = document.getElementById('wallet-num');
    
    // Success Modal Overlay Elements
    const successModal = document.getElementById('success-modal');
    const modalOrderId = document.getElementById('modal-order-id');
    const modalItemsContainer = document.getElementById('modal-items-container');
    const modalItemTotal = document.getElementById('modal-item-total');
    const modalPaymentMethod = document.getElementById('modal-payment-method');
    const modalAddress = document.getElementById('modal-address');

    let cart = [];
    const deliveryFee = 150; // PKR 150 flat delivery fee

    // 2. Render Cart Items inside Summary Column
    function renderCart() {
        // Load cart from global API or localStorage
        if (window.cartAPI) {
            cart = window.cartAPI.getCart();
        } else {
            try {
                cart = JSON.parse(localStorage.getItem('cart')) || [];
            } catch (e) {
                cart = [];
            }
        }

        if (cart.length === 0) {
            // Show fallback empty state, hide form Columns
            if (emptyState) emptyState.classList.remove('hide');
            if (activeView) activeView.classList.add('hide');
            return;
        }

        // Show checkout columns, hide empty fallback view
        if (emptyState) emptyState.classList.add('hide');
        if (activeView) activeView.classList.remove('hide');

        // Clear existing items in list
        if (cartItemsList) {
            cartItemsList.innerHTML = '';

            // Inject cart item cards dynamically
            cart.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'cart-item-card';
                itemCard.innerHTML = `
                    <div class="cart-item-img-wrap">
                        <img src="${item.image || 'assets/images/menu-burger-1.jpg'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-header">
                            <h4 class="cart-item-title">${item.name}</h4>
                            <button type="button" class="cart-item-remove-btn" aria-label="Remove Item" data-name="${item.name}">
                                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                        </div>
                        <div class="cart-item-footer">
                            <span class="cart-item-price">Rs. ${(item.price || 0).toLocaleString()}</span>
                            <div class="cart-item-qty-counter">
                                <button type="button" class="qty-btn qty-btn-sm dec-qty" data-name="${item.name}">
                                    <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                                </button>
                                <span class="qty-display">${item.quantity || 1}</span>
                                <button type="button" class="qty-btn qty-btn-sm inc-qty" data-name="${item.name}">
                                    <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                cartItemsList.appendChild(itemCard);
            });

            bindCartEvents();
        }

        updatePricing();
    }

    // 3. Bind Item-Specific Controls (quantity counters & delete buttons)
    function bindCartEvents() {
        // Quantity Plus
        document.querySelectorAll('.inc-qty').forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                const item = cart.find(i => i.name === name);
                if (item && item.quantity < 10) { // Enforce max 10 of same item
                    item.quantity += 1;
                    saveCartState();
                }
            });
        });

        // Quantity Minus
        document.querySelectorAll('.dec-qty').forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                const item = cart.find(i => i.name === name);
                if (item && item.quantity > 1) { // Min 1 quantity
                    item.quantity -= 1;
                    saveCartState();
                }
            });
        });

        // Remove from Cart
        document.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                cart = cart.filter(i => i.name !== name);
                saveCartState();
            });
        });
    }

    // Save cart to local storage and re-render
    function saveCartState() {
        if (window.cartAPI) {
            window.cartAPI.saveCart(cart);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        renderCart();
    }

    // 4. Update Billing Subtotal and Grand Totals
    function updatePricing() {
        const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        const grandTotal = subtotal + deliveryFee;

        if (receiptSubtotal) {
            receiptSubtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
        }
        if (receiptTotal) {
            receiptTotal.textContent = `Rs. ${grandTotal.toLocaleString()}`;
        }
    }

    // 5. Payment Method Cards Selector logic
    paymentCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active classes
            paymentCards.forEach(c => c.classList.remove('active'));
            // Set current active
            this.classList.add('active');

            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                togglePaymentFields(radio.value);
            }
        });
    });

    function togglePaymentFields(paymentMethod) {
        // Hide panels
        panelCardFields.classList.add('hide');
        panelWalletFields.classList.add('hide');
        
        // Clear requirements
        setRequiredFields(cardNumInput, false);
        setRequiredFields(cardExpiryInput, false);
        setRequiredFields(cardCvvInput, false);
        setRequiredFields(walletNumInput, false);

        // Enable based on selection
        if (paymentMethod === 'card') {
            panelCardFields.classList.remove('hide');
            setRequiredFields(cardNumInput, true);
            setRequiredFields(cardExpiryInput, true);
            setRequiredFields(cardCvvInput, true);
        } else if (paymentMethod === 'wallet') {
            panelWalletFields.classList.remove('hide');
            setRequiredFields(walletNumInput, true);
        }
    }

    function setRequiredFields(inputElement, isRequired) {
        if (inputElement) {
            if (isRequired) {
                inputElement.setAttribute('required', 'required');
            } else {
                inputElement.removeAttribute('required');
                inputElement.value = ''; // Reset values when closed
            }
        }
    }

    // 6. Payment Fields auto-formatting
    if (cardNumInput) {
        cardNumInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formatted = value.match(/.{1,4}/g);
            e.target.value = formatted ? formatted.join(' ') : '';
        });
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                e.target.value = value;
            }
        });
    }

    if (walletNumInput) {
        walletNumInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // 7. Order Form Submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate contact fields
            const custName = document.getElementById('cust-name').value.trim();
            const custPhone = document.getElementById('cust-phone').value.trim();
            const custEmail = document.getElementById('cust-email').value.trim();
            const custAddress = document.getElementById('cust-address').value.trim();
            
            if (!custName || !custPhone || !custEmail || !custAddress) {
                alert("Please fill in all required fields.");
                return;
            }

            // Get payment type text
            const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
            const paymentMethodValue = selectedRadio ? selectedRadio.value : 'cod';
            
            let paymentText = "Cash on Delivery";
            if (paymentMethodValue === 'card') {
                paymentText = "Credit / Debit Card";
            } else if (paymentMethodValue === 'wallet') {
                paymentText = "Mobile Wallet (JazzCash/Easypaisa)";
            }

            // Generate order details
            const orderIdNum = Math.floor(10000 + Math.random() * 90000); // 5 digit Order ID
            const grandTotalText = receiptTotal.textContent;

            // Render ordered items in success screen modal
            if (modalItemsContainer) {
                modalItemsContainer.innerHTML = cart.map(item => `
                    <div class="modal-item-row-entry">
                        <span class="modal-item-name-qty">${item.name} <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 4px;">x${item.quantity}</span></span>
                        <span class="modal-item-price-val">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                `).join('');
            }

            if (modalOrderId) modalOrderId.textContent = `Order ID: #CL-${orderIdNum}`;
            if (modalItemTotal) modalItemTotal.textContent = grandTotalText;
            if (modalPaymentMethod) modalPaymentMethod.textContent = paymentText;
            if (modalAddress) modalAddress.textContent = custAddress;

            // Clear cart from local storage
            if (window.cartAPI) {
                window.cartAPI.saveCart([]);
            } else {
                localStorage.removeItem('cart');
            }

            // Trigger animated Success Modal
            if (successModal) {
                successModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock scrolling
            }
        });
    }

    // Render cart on load
    renderCart();
});
