document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const tableBody = document.getElementById('bookings-table-body');
    const searchInput = document.getElementById('admin-search-input');
    const filterButtons = document.querySelectorAll('.filter-badge-btn');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnClearAll = document.getElementById('btn-clear-all');

    // Orders Selectors
    const ordersTableBody = document.getElementById('orders-table-body');
    const ordersSearchInput = document.getElementById('admin-orders-search');
    const btnExportOrdersCsv = document.getElementById('btn-export-orders-csv');
    const btnClearOrders = document.getElementById('btn-clear-orders');

    // Stats Counters
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statConfirmed = document.getElementById('stat-confirmed');
    const statCancelled = document.getElementById('stat-cancelled');
    const statOrders = document.getElementById('stat-orders');

    // Toaster elements
    const toast = document.getElementById('toast-success');
    const toastMsg = document.getElementById('toast-msg');

    // State Variables
    let reservations = [];
    let orders = [];
    let currentFilter = 'All';
    let currentSearchQuery = '';
    let currentOrdersSearchQuery = '';
    let activeTab = 'reservations';

    // Initialize Page
    init();

    function init() {
        loadReservations();
        loadOrders();
        setupListeners();
    }

    // 1. Load data from localStorage or API
    async function loadReservations() {
        try {
            const url = `https://celestia-api-46o5.onrender.com/api/reservations?status=${currentFilter}&search=${currentSearchQuery}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("API load error");
            reservations = await response.json();
            // Fetch stats from API
            await loadStatsAPI();
        } catch (err) {
            console.warn("Backend API offline. Loading from localStorage.", err);
            // Local fallback
            try {
                reservations = JSON.parse(localStorage.getItem('celestia_reservations')) || [];
            } catch (err2) {
                reservations = [];
            }
            updateStatsLocal();
        }
        renderTable();
    }

    async function loadOrders() {
        try {
            const response = await fetch('https://celestia-api-46o5.onrender.com/api/orders');
            if (!response.ok) throw new Error("API orders load error");
            orders = await response.json();
        } catch (err) {
            console.warn("Backend API offline. Loading orders from localStorage.", err);
            try {
                orders = JSON.parse(localStorage.getItem('celestia_orders')) || [];
            } catch (err2) {
                orders = [];
            }
        }
        renderOrdersTable();
        await loadStatsAPI();
    }

    async function loadStatsAPI() {
        try {
            const response = await fetch('https://celestia-api-46o5.onrender.com/api/stats');
            if (!response.ok) throw new Error("API stats error");
            const stats = await response.json();
            animateCounter(statTotal, stats.totalBookings);
            animateCounter(statPending, stats.pending);
            animateCounter(statConfirmed, stats.confirmed);
            animateCounter(statCancelled, stats.cancelled);
            animateCounter(statOrders, stats.totalOrders || 0);
        } catch (err) {
            updateStatsLocal();
        }
    }

    function updateStatsLocal() {
        const total = reservations.length;
        const pending = reservations.filter(r => r.status === 'Pending').length;
        const confirmed = reservations.filter(r => r.status === 'Confirmed').length;
        const cancelled = reservations.filter(r => r.status === 'Cancelled').length;

        animateCounter(statTotal, total);
        animateCounter(statPending, pending);
        animateCounter(statConfirmed, confirmed);
        animateCounter(statCancelled, cancelled);
        animateCounter(statOrders, orders.length);
    }

    // Save current state back to localStorage (used in fallback mode)
    function saveReservations() {
        try {
            localStorage.setItem('celestia_reservations', JSON.stringify(reservations));
        } catch (err) {
            console.error("Failed to save reservations to localStorage:", err);
        }
        updateStatsLocal();
    }

    // Increment counting animations for premium feel
    function animateCounter(element, targetVal) {
        if (!element) return;
        const duration = 400; // ms
        const startVal = parseInt(element.textContent) || 0;
        if (startVal === targetVal) {
            element.textContent = targetVal;
            return;
        }

        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out function
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(startVal + (targetVal - startVal) * ease);
            
            element.textContent = currentVal;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetVal;
            }
        }
        
        requestAnimationFrame(update);
    }

    // 3. Render table items dynamically
    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        // Filter records by status and search queries
        const filtered = reservations.filter(item => {
            const matchesStatus = (currentFilter === 'All') || (item.status === currentFilter);
            const searchQueryLower = currentSearchQuery.toLowerCase();
            const matchesSearch = !currentSearchQuery || 
                (item.name && item.name.toLowerCase().includes(searchQueryLower)) ||
                (item.email && item.email.toLowerCase().includes(searchQueryLower)) ||
                (item.subject && item.subject.toLowerCase().includes(searchQueryLower)) ||
                (item.message && item.message.toLowerCase().includes(searchQueryLower));
            
            return matchesStatus && matchesSearch;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="table-empty-row">
                        <div class="empty-state">
                            <svg viewBox="0 0 24 24" width="48" height="48"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H10v-2h4v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                            <p>${reservations.length === 0 ? 'No bookings submitted yet.' : 'No reservation inquiries match your search filter.'}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'reveal';
            tr.style.opacity = '1';
            tr.style.transform = 'translateY(0)';

            const statusClass = 'status-' + item.status.toLowerCase();
            
            // Build action buttons state checks
            const isConfirmed = item.status === 'Confirmed';
            const isCancelled = item.status === 'Cancelled';

            tr.innerHTML = `
                <td>
                    <div class="client-info-block">
                        <span class="client-name">${escapeHTML(item.name)}</span>
                        <a href="mailto:${escapeHTML(item.email)}" class="client-email">${escapeHTML(item.email)}</a>
                    </div>
                </td>
                <td>
                    <div class="message-block">
                        <div class="message-subject">${escapeHTML(item.subject)}</div>
                        <div class="message-text" title="${escapeHTML(item.message)}">${escapeHTML(item.message)}</div>
                    </div>
                </td>
                <td>
                    <span class="submitted-time-text">${escapeHTML(item.date)}</span>
                </td>
                <td>
                    <span class="status-pill ${statusClass}">${escapeHTML(item.status)}</span>
                </td>
                <td>
                    <div class="action-controls-wrap">
                        <!-- Confirm Button -->
                        <button class="btn-table-action btn-confirm" data-id="${item.id}" title="Confirm Table Booking" ${isConfirmed ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        </button>
                        <!-- Cancel Button -->
                        <button class="btn-table-action btn-cancel" data-id="${item.id}" title="Cancel/Decline Reservation" ${isCancelled ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                        <!-- Delete Button -->
                        <button class="btn-table-action btn-delete" data-id="${item.id}" title="Permanently Delete Record">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Re-attach listeners to dynamic action buttons
        attachTableActionListeners();
    }

    // Helper to prevent HTML injections
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 4. Listeners setup
    function setupListeners() {
        // Tab switching
        const tabReservations = document.getElementById('tab-reservations');
        const tabOrders = document.getElementById('tab-orders');
        const reservationsView = document.getElementById('reservations-view');
        const ordersView = document.getElementById('orders-view');

        if (tabReservations && tabOrders) {
            tabReservations.addEventListener('click', () => {
                tabReservations.classList.add('active');
                tabOrders.classList.remove('active');
                reservationsView.classList.remove('hide');
                ordersView.classList.add('hide');
                activeTab = 'reservations';
            });

            tabOrders.addEventListener('click', () => {
                tabOrders.classList.add('active');
                tabReservations.classList.remove('active');
                ordersView.classList.remove('hide');
                reservationsView.classList.add('hide');
                activeTab = 'orders';
                renderOrdersTable();
            });
        }

        // Reservations Search Input listener
        let searchTimeout;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentSearchQuery = e.target.value.trim();
                    renderTable();
                }, 200);
            });
        }

        // Status Tabs listener
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTable();
            });
        });

        // Export CSV button click
        if (btnExportCsv) {
            btnExportCsv.addEventListener('click', exportToCSV);
        }

        // Clear All button click
        if (btnClearAll) {
            btnClearAll.addEventListener('click', clearAllReservations);
        }

        // Orders Search Input listener
        if (ordersSearchInput) {
            let searchTimeoutOrders;
            ordersSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeoutOrders);
                searchTimeoutOrders = setTimeout(() => {
                    currentOrdersSearchQuery = e.target.value.trim();
                    renderOrdersTable();
                }, 200);
            });
        }

        // Export Orders CSV button click
        if (btnExportOrdersCsv) {
            btnExportOrdersCsv.addEventListener('click', exportOrdersToCSV);
        }

        // Clear All Orders button click
        if (btnClearOrders) {
            btnClearOrders.addEventListener('click', clearAllOrders);
        }
    }

    // Attach click events on Confirm, Cancel, Delete buttons in rows
    function attachTableActionListeners() {
        // Confirm Button click
        document.querySelectorAll('.btn-confirm').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                updateItemStatus(id, 'Confirmed');
            });
        });

        // Cancel Button click
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                updateItemStatus(id, 'Cancelled');
            });
        });

        // Delete Button click
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                deleteReservation(id);
            });
        });
    }

    // 5. Action Handlers
    async function updateItemStatus(id, newStatus) {
        try {
            const response = await fetch(`https://celestia-api-46o5.onrender.com/api/reservations/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error("API status update error");
            const updatedItem = await response.json();
            
            // Update local state copy
            const idx = reservations.findIndex(r => r.id === id);
            if (idx !== -1) reservations[idx] = updatedItem;
            
            await loadStatsAPI();
            renderTable();
            showToast(`Reservation set to: ${newStatus}`);
        } catch (err) {
            console.warn("Backend API offline. Updating status locally.", err);
            const itemIndex = reservations.findIndex(r => r.id === id);
            if (itemIndex === -1) return;

            reservations[itemIndex].status = newStatus;
            saveReservations();
            renderTable();
            showToast(`Reservation set to: ${newStatus}`);
        }
    }

    async function deleteReservation(id) {
        const item = reservations.find(r => r.id === id);
        if (!item) return;

        const confirmDelete = confirm(`Are you sure you want to permanently delete the reservation inquiry from "${item.name}"?`);
        if (!confirmDelete) return;

        try {
            const response = await fetch(`https://celestia-api-46o5.onrender.com/api/reservations/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error("API delete error");
            
            reservations = reservations.filter(r => r.id !== id);
            await loadStatsAPI();
            renderTable();
            showToast("Reservation record deleted permanently.");
        } catch (err) {
            console.warn("Backend API offline. Deleting locally.", err);
            reservations = reservations.filter(r => r.id !== id);
            saveReservations();
            renderTable();
            showToast("Reservation record deleted permanently.");
        }
    }

    function clearAllReservations() {
        if (reservations.length === 0) {
            alert("No reservation records exist to clear.");
            return;
        }

        const verify1 = confirm("CAUTION: This will permanently delete ALL loaded reservation inquiries. Do you want to proceed?");
        if (!verify1) return;

        const verify2 = confirm("FINAL CHECK: Are you absolutely sure? This action is irreversible.");
        if (!verify2) return;

        // Perform local storage wipe
        localStorage.removeItem('celestia_reservations');
        reservations = [];
        updateStatsLocal();
        renderTable();
        showToast("Cleared local reservation records.");
    }

    // Export CSV module logic
    function exportToCSV() {
        if (reservations.length === 0) {
            alert("No reservation data available to export.");
            return;
        }

        // Headers
        const headers = ["ID", "Client Name", "Email Address", "Inquiry Subject", "Message Description", "Submitted Date", "Status"];
        
        // Convert array to CSV row format
        const csvRows = [headers.join(",")];
        
        reservations.forEach(item => {
            const values = [
                item.id,
                `"${escapeCSVCell(item.name)}"`,
                `"${escapeCSVCell(item.email)}"`,
                `"${escapeCSVCell(item.subject)}"`,
                `"${escapeCSVCell(item.message)}"`,
                `"${escapeCSVCell(item.date)}"`,
                item.status
            ];
            csvRows.push(values.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        
        // Create dynamic hidden hyperlink download link
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `celestia_reservations_${Date.now()}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        showToast("CSV file exported successfully.");
    }

    function escapeCSVCell(str) {
        if (!str) return '';
        return str.replace(/"/g, '""'); // Escape double quotes by doubling them
    }

    // Orders rendering and action handlers
    function renderOrdersTable() {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = '';

        const filtered = orders.filter(item => {
            const searchQueryLower = currentOrdersSearchQuery.toLowerCase();
            const matchesSearch = !currentOrdersSearchQuery || 
                (item.id && item.id.toLowerCase().includes(searchQueryLower)) ||
                (item.customer && item.customer.name && item.customer.name.toLowerCase().includes(searchQueryLower)) ||
                (item.customer && item.customer.email && item.customer.email.toLowerCase().includes(searchQueryLower)) ||
                (item.billing && item.billing.toLowerCase().includes(searchQueryLower));
            
            return matchesSearch;
        });

        if (filtered.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-empty-row">
                        <div class="empty-state">
                            <svg viewBox="0 0 24 24" width="48" height="48"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H10v-2h4v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                            <p>${orders.length === 0 ? 'No orders placed yet.' : 'No orders match your search query.'}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'reveal';
            tr.style.opacity = '1';
            tr.style.transform = 'translateY(0)';

            // Render list of items
            const itemsListHTML = (item.items || []).map(prod => 
                `<li>${escapeHTML(prod.name)} <strong style="color: var(--primary);">x${prod.quantity}</strong></li>`
            ).join('');

            // Format date
            const dateStr = item.date ? new Date(item.date).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'N/A';

            tr.innerHTML = `
                <td>
                    <div class="client-info-block">
                        <span class="client-name" style="color: var(--primary); font-family: var(--font-display); font-weight: 600;">#${escapeHTML(item.id)}</span>
                        <span class="submitted-time-text" style="font-size: 0.8rem; opacity: 0.8;">${dateStr}</span>
                    </div>
                </td>
                <td>
                    <div class="client-info-block">
                        <span class="client-name">${escapeHTML(item.customer ? item.customer.name : 'Unknown')}</span>
                        <a href="mailto:${escapeHTML(item.customer ? item.customer.email : '')}" class="client-email">${escapeHTML(item.customer ? item.customer.email : '')}</a>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(item.customer ? item.customer.phone : '')}</span>
                    </div>
                </td>
                <td>
                    <ul class="order-items-list">
                        ${itemsListHTML}
                    </ul>
                </td>
                <td>
                    <span style="font-weight: 600; color: var(--primary);">Rs. ${(item.grandTotal || 0).toLocaleString()}</span>
                </td>
                <td>
                    <div style="font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: normal;" title="${escapeHTML(item.billing)}">
                        ${escapeHTML(item.billing)}
                    </div>
                </td>
                <td>
                    <span class="status-pill status-confirmed" style="background: rgba(23, 162, 184, 0.1); border-color: #17a2b8; color: #17a2b8;">${escapeHTML(item.payment || 'COD')}</span>
                </td>
                <td>
                    <div class="action-controls-wrap">
                        <!-- Delete Button -->
                        <button class="btn-table-action btn-delete-order" data-id="${item.id}" title="Permanently Delete Order">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </td>
            `;

            ordersTableBody.appendChild(tr);
        });

        // Attach action listeners for orders
        attachOrdersActionListeners();
    }

    function attachOrdersActionListeners() {
        document.querySelectorAll('.btn-delete-order').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                deleteOrder(id);
            });
        });
    }

    async function deleteOrder(id) {
        const confirmDelete = confirm(`Are you sure you want to permanently delete order #${id}?`);
        if (!confirmDelete) return;

        try {
            const response = await fetch(`https://celestia-api-46o5.onrender.com/api/orders/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error("Delete endpoint error");
        } catch (err) {
            console.warn("Delete order API endpoint error. Deleting locally.", err);
        }
        
        orders = orders.filter(o => o.id !== id);
        try {
            localStorage.setItem('celestia_orders', JSON.stringify(orders));
        } catch (e) {}
        
        renderOrdersTable();
        updateStatsLocal();
        showToast("Order record deleted permanently.");
    }

    function clearAllOrders() {
        if (orders.length === 0) {
            alert("No order records exist to clear.");
            return;
        }

        const verify1 = confirm("CAUTION: This will permanently delete ALL online orders. Do you want to proceed?");
        if (!verify1) return;

        const verify2 = confirm("FINAL CHECK: Are you absolutely sure? This action is irreversible.");
        if (!verify2) return;

        localStorage.removeItem('celestia_orders');
        orders = [];
        updateStatsLocal();
        renderOrdersTable();
        showToast("Cleared online order records.");
    }

    function exportOrdersToCSV() {
        if (orders.length === 0) {
            alert("No order data available to export.");
            return;
        }

        const headers = ["Order ID", "Date", "Customer Name", "Email", "Phone", "Items Ordered", "Grand Total", "Address", "Payment Method"];
        const csvRows = [headers.join(",")];
        
        orders.forEach(item => {
            const itemsStr = (item.items || []).map(p => `${p.name} (x${p.quantity})`).join("; ");
            const values = [
                item.id,
                `"${escapeCSVCell(item.date)}"`,
                `"${escapeCSVCell(item.customer ? item.customer.name : 'Unknown')}"`,
                `"${escapeCSVCell(item.customer ? item.customer.email : '')}"`,
                `"${escapeCSVCell(item.customer ? item.customer.phone : '')}"`,
                `"${escapeCSVCell(itemsStr)}"`,
                item.grandTotal,
                `"${escapeCSVCell(item.billing)}"`,
                `"${escapeCSVCell(item.payment || 'COD')}"`
            ];
            csvRows.push(values.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `celestia_orders_${Date.now()}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        showToast("Orders CSV file exported successfully.");
    }

    // Toast triggers helper
    function showToast(message) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3500);
    }
});
