const MENU_ITEMS = [
    // Burgers
    {
        id: 1,
        name: "Celestia Signature Burger",
        category: "burgers",
        price: 1450,
        image: "assets/images/menu-burger-1.jpg",
        description: "Hand-pressed A5 Wagyu beef patty, house-made black truffle aioli, aged English cheddar, wild baby arugula, toasted brioche bun.",
        rating: 5,
        badge: "Chef Special"
    },
    {
        id: 2,
        name: "Imperial Forest Burger",
        category: "burgers",
        price: 1650,
        image: "assets/images/menu-burger-2.jpg",
        description: "Grass-fed double beef patty, sautéed balsamic wild mushrooms, rich French brie cheese, caramelized red onion marmalade.",
        rating: 5,
        badge: "Luxury Option"
    },
    
    // Pizza
    {
        id: 3,
        name: "Truffle & Mushroom Pizza",
        category: "pizza",
        price: 1550,
        image: "assets/images/menu-pizza-1.jpg",
        description: "Stone-baked sourdough crust topped with white truffle oil, roasted chanterelle mushrooms, creamy buffalo mozzarella, fresh sweet basil.",
        rating: 5,
        badge: "Best Seller"
    },
    {
        id: 4,
        name: "Prosciutto Crudo Pizza",
        category: "pizza",
        price: 1750,
        image: "assets/images/menu-pizza-2.jpg",
        description: "Crushed San Marzano tomatoes, fresh mozzarella, cured Prosciutto di Parma, dressed baby arugula, shaved Parmigiano-Reggiano, olive oil.",
        rating: 4,
        badge: "Authentic"
    },
    
    // BBQ
    {
        id: 5,
        name: "Smoked Iberico Pork Ribs",
        category: "bbq",
        price: 2250,
        image: "assets/images/menu-bbq-1.jpg",
        description: "Slow-smoked Spanish Iberico pork ribs glazed with artisanal lavender-honey bourbon BBQ sauce, served with crisp vinegar slaw.",
        rating: 5,
        badge: "Smokey Delight"
    },
    {
        id: 6,
        name: "14-Hour Cherrywood Brisket",
        category: "bbq",
        price: 2350,
        image: "assets/images/menu-bbq-2.jpg",
        description: "Prime beef brisket smoked over local cherrywood logs for 14 hours. Served thick-sliced with house mustard dressing and pickled gherkins.",
        rating: 5,
        badge: "Signature Pit"
    },
    
    // Fast Food
    {
        id: 7,
        name: "Maine Lobster Brioche Roll",
        category: "fast food",
        price: 2400,
        image: "assets/images/menu-fast-1.jpg",
        description: "Chilled fresh Maine lobster claw and tail meat lightly tossed in drawn chive-lemon butter, served inside a toasted split-top brioche bun.",
        rating: 5,
        badge: "Ocean Fresh"
    },
    {
        id: 8,
        name: "Parmesan White Truffle Fries",
        category: "fast food",
        price: 750,
        image: "assets/images/menu-fast-2.jpg",
        description: "Double-fried Idaho russet potatoes tossed in premium Italian white truffle oil, grated Parmigiano-Reggiano, chopped flat-leaf parsley, garlic aioli.",
        rating: 4,
        badge: "Favorite Side"
    },
    
    // Drinks
    {
        id: 9,
        name: "Saffron Golden Hour Nectar",
        category: "drinks",
        price: 550,
        image: "assets/images/menu-drink-1.jpg",
        description: "Organic saffron thread infusion, sparkling mineral water, cold-pressed lime juice, wild honey ginger syrup, edible 24k gold leaf flakes.",
        rating: 5,
        badge: "Non-Alcoholic"
    },
    {
        id: 10,
        name: "Cucumber Elderflower Tonic",
        category: "drinks",
        price: 450,
        image: "assets/images/menu-drink-2.jpg",
        description: "Muddled English hothouse cucumber, fresh sweet basil leaves, organic lime juice, wild elderflower syrup, sparkling tonic water.",
        rating: 4,
        badge: "Refreshing"
    },
    
    // Desserts
    {
        id: 11,
        name: "Saffron Deconstructed Tiramisu",
        category: "desserts",
        price: 850,
        image: "assets/images/menu-dessert-1.jpg",
        description: "Espresso-soaked artisanal ladyfingers layered with saffron-whipped Italian mascarpone cream cheese, dusted with organic dark cocoa powder.",
        rating: 5,
        badge: "Chef Original"
    },
    {
        id: 12,
        name: "Velvet Chocolate Lava Melt",
        category: "desserts",
        price: 750,
        image: "assets/images/menu-dessert-2.jpg",
        description: "Warm single-origin Belgian dark chocolate cake with a molten liquid core, served with organic fresh raspberries and Madagascar vanilla gelato.",
        rating: 5,
        badge: "Warm Comfort"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-grid-container');
    const searchInput = document.getElementById('menu-search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    let activeCategory = 'all';
    let searchQuery = '';
    let currentMenuItems = [];

    // Helper to fetch menu data from Express API
    async function fetchMenuData() {
        try {
            const url = `http://localhost:3000/api/menu?category=${activeCategory}&search=${searchQuery}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("API response error");
            currentMenuItems = await response.json();
        } catch (err) {
            console.warn("Backend API offline. Falling back to local mock data.", err);
            // Fallback filtering in memory using local static array
            currentMenuItems = MENU_ITEMS.filter(item => {
                const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
                const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                                      item.description.toLowerCase().includes(searchQuery);
                return matchesCategory && matchesSearch;
            });
        }
    }

    // Function to render items in menu grid
    async function renderMenu() {
        if (!menuGrid) return;
        
        // Show dynamic spinner
        menuGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 5rem 0; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <svg width="40" height="40" viewBox="0 0 38 38" stroke="var(--primary)" style="animation: spin 1s linear infinite;">
                    <g fill="none" fill-rule="evenodd">
                        <g transform="translate(1 1)" stroke-width="2">
                            <circle stroke-opacity=".1" cx="18" cy="18" r="18"/>
                            <path d="M36 18c0-9.94-8.06-18-18-18"/>
                        </g>
                    </g>
                </svg>
                <p style="font-family: var(--font-ui); font-size: 0.95rem; letter-spacing: 0.5px;">Curating Delicacies...</p>
            </div>
        `;

        // Inject dynamic style for spin keyframes if not present
        if (!document.getElementById('menu-spin-keyframes')) {
            const style = document.createElement('style');
            style.id = 'menu-spin-keyframes';
            style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
        
        await fetchMenuData();
        
        menuGrid.innerHTML = '';
 
        if (currentMenuItems.length === 0) {
            menuGrid.innerHTML = `
                <div class="no-results">
                    <svg viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <h3>No Delicacies Found</h3>
                    <p>We couldn't find any menu items matching your search or selected category.</p>
                </div>
            `;
            return;
        }

        // Render cards
        currentMenuItems.forEach((item, index) => {
            const ratingStars = Array(5).fill('')
                .map((_, i) => `<svg class="star-icon" viewBox="0 0 24 24" style="fill: ${i < item.rating ? 'var(--primary)' : 'var(--text-muted)'}"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`)
                .join('');

            const card = document.createElement('div');
            card.className = 'glass-card menu-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            card.innerHTML = `
                <div>
                    <div class="menu-card-img-wrap">
                        <img src="${item.image}" alt="${item.name}">
                        <span class="menu-card-badge">${item.badge}</span>
                    </div>
                    <div class="menu-card-info">
                        <div class="menu-card-rating">
                            ${ratingStars}
                        </div>
                        <h3 class="menu-card-title">${item.name}</h3>
                        <p class="menu-card-desc">${item.description}</p>
                    </div>
                </div>
                <div class="menu-card-info" style="padding-top: 0;">
                    <div class="menu-card-footer">
                        <span class="menu-card-price">Rs. ${item.price.toLocaleString()}</span>
                        <button class="btn-icon-only add-to-order" data-id="${item.id}" aria-label="Add to Order">
                            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </button>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });

        // Bind quick click handler to add item to cart
        document.querySelectorAll('.add-to-order').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const itemId = this.getAttribute('data-id');
                const selectedItem = currentMenuItems.find(i => i.id == itemId) || MENU_ITEMS.find(i => i.id == itemId);
                
                // Add selected item details to cart using global API
                if (window.cartAPI) {
                    window.cartAPI.addToCart(selectedItem);
                }
                
                // Show a mini visual confirmation
                const checkIcon = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
                const originalIcon = this.innerHTML;
                
                this.innerHTML = checkIcon;
                this.style.background = '#d4af37';
                this.style.borderColor = '#d4af37';
                
                // Revert icon after 1 second
                setTimeout(() => {
                    this.innerHTML = originalIcon;
                    this.style.background = '';
                    this.style.borderColor = '';
                }, 1000);
            });
        });
    }

    // 1. Search filter event listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderMenu();
        });
    }

    // 2. Category button event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active from all
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add to current
            e.target.classList.add('active');
            
            // Set active category
            activeCategory = e.target.getAttribute('data-filter');
            renderMenu();
        });
    });

    // Initial load
    renderMenu();
});
