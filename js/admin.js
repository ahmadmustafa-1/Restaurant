document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const tableBody = document.getElementById('bookings-table-body');
    const searchInput = document.getElementById('admin-search-input');
    const filterButtons = document.querySelectorAll('.filter-badge-btn');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnClearAll = document.getElementById('btn-clear-all');

    // Stats Counters
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statConfirmed = document.getElementById('stat-confirmed');
    const statCancelled = document.getElementById('stat-cancelled');

    // Toaster elements
    const toast = document.getElementById('toast-success');
    const toastMsg = document.getElementById('toast-msg');

    // State Variables
    let reservations = [];
    let currentFilter = 'All';
    let currentSearchQuery = '';

    // Initialize Page
    init();

    function init() {
        loadReservations();
        setupListeners();
    }

    // 1. Load data from localStorage or API
    async function loadReservations() {
        try {
            const url = `http://localhost:3000/api/reservations?status=${currentFilter}&search=${currentSearchQuery}`;
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

    async function loadStatsAPI() {
        try {
            const response = await fetch('http://localhost:3000/api/stats');
            if (!response.ok) throw new Error("API stats error");
            const stats = await response.json();
            animateCounter(statTotal, stats.totalBookings);
            animateCounter(statPending, stats.pending);
            animateCounter(statConfirmed, stats.confirmed);
            animateCounter(statCancelled, stats.cancelled);
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
        // Search Input listener
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
            const response = await fetch(`http://localhost:3000/api/reservations/${id}/status`, {
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
            const response = await fetch(`http://localhost:3000/api/reservations/${id}`, {
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
