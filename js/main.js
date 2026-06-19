document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggling
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            // Toggle body scrolling to prevent background scroll when menu is open
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when navigation link is clicked
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // 2. Sticky Glass Header on Scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
    });

    // 3. Highlight Active Navigation Item based on current URL
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (pageName === href || (pageName === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 4. Scroll Reveal Animation Observer
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after showing so animation runs once
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters view fully
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // 5. Setup dynamic smooth scrolling for anchors (for UX comfort)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 6. Preloader Fade Out (Bonus Feature)
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Fade out preloader once all window assets (including heavy images) are loaded
        window.addEventListener('load', () => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.remove(); // Remove from DOM to keep it clean
            }, 500);
        });

        // Backup safeguard: if window load takes too long, fade it out after 3.5 seconds anyway
        setTimeout(() => {
            if (preloader && !preloader.classList.contains('fade-out')) {
                preloader.classList.add('fade-out');
                setTimeout(() => preloader.remove(), 500);
            }
        }, 3500);
    }

    // 7. Back To Top Button Click & Scroll (Bonus Feature)
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 8. Theme Toggling (Dark / Light Mode - Bonus Feature)
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-theme');
            
            // Persist the theme choice in local storage
            if (document.documentElement.classList.contains('light-theme')) {
                localStorage.setItem('theme', 'light');
            } else {
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Global Cart API
    window.cartAPI = {
        getCart: function() {
            try {
                return JSON.parse(localStorage.getItem('cart')) || [];
            } catch (e) {
                console.error("Error parsing cart:", e);
                return [];
            }
        },
        saveCart: function(cart) {
            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartBadge();
        },
        addToCart: function(item) {
            const cart = this.getCart();
            const existingItem = cart.find(i => i.name === item.name);
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                item.quantity = 1;
                cart.push(item);
            }
            this.saveCart(cart);
        },
        updateCartBadge: function() {
            const cart = this.getCart();
            const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const badge = document.getElementById('cart-badge-count');
            if (badge) {
                badge.textContent = totalCount;
                if (totalCount > 0) {
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    };

    // Update cart count badge on page load
    window.cartAPI.updateCartBadge();

    // 9. Featured Dishes Order Click (Home page to checkout)
    const featuredOrderBtns = document.querySelectorAll('.featured-order-btn');
    featuredOrderBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const name = this.getAttribute('data-name');
            const price = parseInt(this.getAttribute('data-price')) || 0;
            const image = this.getAttribute('data-image');
            const badge = this.getAttribute('data-badge');
            const description = this.getAttribute('data-desc');

            const item = {
                name: name,
                price: price,
                image: image,
                badge: badge,
                description: description
            };

            // Add item to cart using global API
            window.cartAPI.addToCart(item);
            
            // Micro-animation feedback
            const checkIcon = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
            const originalIcon = this.innerHTML;
            
            this.innerHTML = checkIcon;
            this.style.background = '#d4af37';
            this.style.borderColor = '#d4af37';
            
            setTimeout(() => {
                this.innerHTML = originalIcon;
                this.style.background = '';
                this.style.borderColor = '';
            }, 1000);
        });
    });
});
