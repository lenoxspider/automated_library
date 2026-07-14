// Global State Management
let currentToken = localStorage.getItem('smartlib_token');
let currentUser = JSON.parse(localStorage.getItem('smartlib_user'));
let currentTheme = localStorage.getItem('smartlib_theme') || 'light';
let charts = {};

// API Headers Helper
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
    };
}

// Show Alert Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-times-circle';
    if (type === 'warning') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Apply Selected Theme
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.querySelector('#theme-switch i');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
        }
    }
    localStorage.setItem('smartlib_theme', theme);
}

// Init Application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Enforcement
    if (!currentToken || !currentUser) {
        localStorage.removeItem('smartlib_token');
        localStorage.removeItem('smartlib_user');
        window.location.href = '/login';
        return;
    }

    // Unhide main workspace once verified
    document.getElementById('app-container').classList.remove('hidden');

    // Theme Switch
    applyTheme(currentTheme);
    document.getElementById('theme-switch').addEventListener('click', () => {
        const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
    });

    // Populate dashboard settings
    setupDashboard(currentUser);

    // Form Event Listeners
    document.getElementById('book-form').addEventListener('submit', handleBookSubmit);
    document.getElementById('issue-form').addEventListener('submit', handleIssueSubmit);
    document.getElementById('admin-user-form').addEventListener('submit', handleAdminUserSubmit);
    const policyForm = document.getElementById('policy-settings-form');
    if (policyForm) {
        policyForm.addEventListener('submit', handlePolicySettingsSubmit);
    }

    // Toggle user role fields inside user modal
    const userFormRole = document.getElementById('user-form-role');
    const userFormUnivFields = document.getElementById('user-form-university-fields');
    if (userFormRole && userFormUnivFields) {
        userFormRole.addEventListener('change', (e) => {
            if (e.target.value === 'member') {
                userFormUnivFields.classList.remove('hidden');
            } else {
                userFormUnivFields.classList.add('hidden');
            }
        });
    }

    // Enforce numbers-only validation as the user types
    const restrictToDigits = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    };

    const inputsToRestrict = [
        'user-form-student-id',
        'user-form-index-number'
    ];

    inputsToRestrict.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', restrictToDigits);
    });

    const reportSelect = document.getElementById('report-select-type');
    if (reportSelect) {
        reportSelect.addEventListener('change', () => {
            loadReportsCenter();
        });
    }

    // Sidebar menu navigation
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            switchView(viewId);
        });
    });

    // Sidebar toggle (for mobile navigation)
    document.querySelector('.sidebar-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });

    // Modal Triggers
    document.getElementById('btn-add-book-modal').addEventListener('click', () => {
        document.getElementById('book-form-id').value = '';
        document.getElementById('book-form').reset();
        document.getElementById('book-modal-title').textContent = 'Add New Book';
        openModal('modal-book');
    });

    document.getElementById('btn-issue-book-modal').addEventListener('click', () => {
        document.getElementById('issue-form').reset();
        loadIssueDropdowns();
        openModal('modal-issue');
    });

    document.getElementById('btn-register-user-modal').addEventListener('click', () => {
        document.getElementById('admin-user-form').reset();
        document.getElementById('user-form-university-fields').classList.remove('hidden');
        openModal('modal-user');
    });

    document.getElementById('admin-user-form').addEventListener('submit', handleAdminUserSubmit);

    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // CSV & JSON Exports
    document.getElementById('btn-export-csv').addEventListener('click', () => exportReport('csv'));
    document.getElementById('btn-export-json').addEventListener('click', () => exportReport('json'));
});

// View Navigation Router
function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.dashboard-view').forEach(view => {
        view.classList.add('hidden');
    });
    // Remove active class from menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected view
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.remove('hidden');
    }

    const activeMenu = document.querySelector(`.menu-item[data-view="${viewId}"]`);
    if (activeMenu) {
        activeMenu.classList.add('active');
    }

    // Set page title
    let pageTitle = 'Dashboard';
    if (viewId === 'view-catalog') pageTitle = 'Book Catalog';
    if (viewId === 'view-member-loans') pageTitle = 'My Borrowings';
    if (viewId === 'view-member-resv') pageTitle = 'My Book Reservations';
    if (viewId === 'view-member-fines') pageTitle = 'My Fines';
    if (viewId === 'view-admin-dashboard') pageTitle = 'Library Performance Dashboard';
    if (viewId === 'view-manage-books') pageTitle = 'Manage Books Inventory';
    if (viewId === 'view-manage-borrowings') pageTitle = 'Book Issue & Returns';
    if (viewId === 'view-manage-reservations') pageTitle = 'Book Reservations Waitlist';
    if (viewId === 'view-manage-fines') pageTitle = 'Collect Late Return Fines';
    if (viewId === 'view-manage-users') pageTitle = 'Register of Members';

    document.getElementById('page-title').textContent = pageTitle;

    // Load data specific to this view
    loadViewData(viewId);

    // Close mobile sidebar
    document.querySelector('.sidebar').classList.remove('open');
}



// Open / Close Modal Helpers
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Setup User Role Context & Layout
function setupDashboard(user) {
    document.getElementById('app-container').classList.remove('hidden');

    document.getElementById('user-display-name').textContent = user.name;
    document.getElementById('user-display-role').textContent = user.role;

    // Dynamically inject roles in dropdown for authenticated registration desk
    const regRole = document.getElementById('reg-role');
    if (regRole) {
        regRole.innerHTML = '<option value="member">Member (Student / Staff)</option>';
        if (user.role === 'admin') {
            regRole.innerHTML += `
                <option value="librarian">Librarian</option>
                <option value="admin">Administrator</option>
            `;
        } else if (user.role === 'librarian') {
            regRole.innerHTML += `
                <option value="librarian">Librarian</option>
            `;
        }
    }

    // Adjust sidebar display according to roles
    document.querySelectorAll('.member-only').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.staff-only').forEach(el => el.classList.add('hidden'));

    if (user.role === 'member') {
        document.querySelectorAll('.member-only').forEach(el => el.classList.remove('hidden'));
        switchView('view-catalog');
    } else if (user.role === 'librarian' || user.role === 'admin') {
        document.querySelectorAll('.staff-only').forEach(el => el.classList.remove('hidden'));
        switchView('view-admin-dashboard');
    }
}

// Fetch API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: getHeaders()
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(endpoint, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

// Load data based on view
function loadViewData(viewId) {
    if (viewId === 'view-catalog') {
        loadCatalogBooks();
    } else if (viewId === 'view-member-loans') {
        loadMemberLoans();
    } else if (viewId === 'view-member-resv') {
        loadMemberReservations();
    } else if (viewId === 'view-member-fines') {
        loadMemberFines();
    } else if (viewId === 'view-admin-dashboard') {
        loadDashboardStats();
    } else if (viewId === 'view-manage-books') {
        loadManageBooks();
    } else if (viewId === 'view-manage-borrowings') {
        loadManageBorrowings();
    } else if (viewId === 'view-manage-reservations') {
        loadManageReservations();
    } else if (viewId === 'view-manage-fines') {
        loadManageFines();
    } else if (viewId === 'view-manage-users') {
        loadManageUsers();
    } else if (viewId === 'view-reports-center') {
        loadReportsCenter();
    } else if (viewId === 'view-borrowing-rules') {
        loadBorrowingRules();
    } else if (viewId === 'view-roster-audit') {
        loadRosterAuditPage();
    }
}

// ==================================================
// PANEL USER CREATION
// ==================================================

async function handleAdminUserSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('user-form-name').value;
    const email = document.getElementById('user-form-email').value;
    const username = document.getElementById('user-form-username').value;
    const password = document.getElementById('user-form-password').value;
    const role = document.getElementById('user-form-role').value;
    
    const student_id = role === 'member' ? document.getElementById('user-form-student-id').value : null;
    const index_number = role === 'member' ? document.getElementById('user-form-index-number').value : null;

    if (role !== 'member' && /\d/.test(name)) {
        showToast('Full Name cannot contain numbers.', 'error');
        return;
    }
    if (role === 'member' && (!student_id || !index_number)) {
        showToast('Student ID and Index Number are required for students.', 'error');
        return;
    }

    try {
        const res = await apiCall('/api/auth/register', 'POST', { username, password, role, name, email, student_id, index_number });
        showToast(res.message || 'Account created successfully!');
        closeModal('modal-user');
        loadManageUsers();
    } catch (err) {
        // Handled by apiCall
    }
}

async function handleLogout() {
    try {
        await apiCall('/api/auth/logout', 'POST');
    } catch (e) {}
    localStorage.removeItem('smartlib_token');
    localStorage.removeItem('smartlib_user');
    window.location.href = '/login';
}


// ==================================================
// SHARED CATALOG LOGIC
// ==================================================

// Search Listener
let searchTimeout;
document.getElementById('catalog-search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadCatalogBooks(e.target.value);
    }, 400);
});

async function loadCatalogBooks(searchQuery = '') {
    const grid = document.getElementById('catalog-books-grid');
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading books...</div>';

    try {
        const books = await apiCall(`/api/books?search=${encodeURIComponent(searchQuery)}`);
        
        if (books.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No books found in the catalog.</div>';
            return;
        }

        grid.innerHTML = '';
        books.forEach(book => {
            const isAvailable = book.available_copies > 0;
            const statusClass = isAvailable ? 'available' : 'unavailable';
            const statusText = isAvailable ? `${book.available_copies} of ${book.total_copies} Available` : 'Out of Stock';

            const card = document.createElement('div');
            card.className = 'book-card';
            
            // Set Reserve button or unavailable button depending on user role
            let actionBtn = '';
            if (currentUser.role === 'member') {
                if (isAvailable) {
                    actionBtn = `<button class="btn btn-primary btn-sm btn-block" onclick="requestReservation(${book.id})">Reserve Book</button>`;
                } else {
                    actionBtn = `<button class="btn btn-secondary btn-sm btn-block" onclick="requestReservation(${book.id})">Join Waitlist</button>`;
                }
            }

            card.innerHTML = `
                <div class="book-info">
                    <span class="badge-role" style="font-size: 10px; margin-bottom: 8px; display: inline-block;">${book.genre}</span>
                    <h3>${book.title}</h3>
                    <p style="font-style: italic; margin-bottom: 4px;">by ${book.author}</p>
                    <p style="font-size: 12px; color: var(--text-secondary);">ISBN: ${book.isbn}</p>
                </div>
                <div class="book-meta">
                    <span class="badge-status ${statusClass}">${statusText}</span>
                    ${actionBtn}
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger-color);">Failed to load catalog.</div>';
    }
}

// Request Reservation (Member)
async function requestReservation(bookId) {
    try {
        const response = await apiCall('/api/reservations', 'POST', { book_id: bookId });
        showToast(response.message);
    } catch (e) {}
}


// ==================================================
// MEMBER PORTAL DATA LOADS
// ==================================================

async function loadMemberLoans() {
    const tbody = document.getElementById('member-loans-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading loan history...</td></tr>';
    
    try {
        const history = await apiCall(`/api/users/${currentUser.id}/history`);
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No borrowing transactions found.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        history.forEach(item => {
            const fineText = item.fine_amount ? `$${item.fine_amount.toFixed(2)} (${item.fine_status})` : '—';
            tbody.innerHTML += `
                <tr>
                    <td>
                        <strong>${item.title}</strong><br>
                        <span style="font-size: 12px; color: var(--text-secondary);">by ${item.author} (ISBN: ${item.isbn})</span>
                    </td>
                    <td>${item.borrow_date}</td>
                    <td>${item.due_date}</td>
                    <td>${item.return_date || '—'}</td>
                    <td><span class="badge-status-item ${item.status}">${item.status}</span></td>
                    <td>${fineText}</td>
                </tr>
            `;
        });
    } catch (e) {}
}

async function loadMemberReservations() {
    const tbody = document.getElementById('member-resv-tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading reservations...</td></tr>';
    
    try {
        const resvs = await apiCall('/api/reservations');
        if (resvs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No active reservations.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        resvs.forEach(res => {
            const cancelBtn = res.status === 'pending' 
                ? `<button class="btn btn-danger btn-sm" onclick="cancelReservation(${res.id})">Cancel</button>` 
                : '—';
            
            tbody.innerHTML += `
                <tr>
                    <td>
                        <strong>${res.title}</strong><br>
                        <span style="font-size: 12px; color: var(--text-secondary);">by ${res.author}</span>
                    </td>
                    <td>${res.reservation_date}</td>
                    <td><span class="badge-status-item ${res.status}">${res.status}</span></td>
                    <td>${cancelBtn}</td>
                </tr>
            `;
        });
    } catch (e) {}
}

async function cancelReservation(id) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
        const res = await apiCall(`/api/reservations/${id}/cancel`, 'POST');
        showToast(res.message);
        loadMemberReservations();
    } catch (e) {}
}

async function loadMemberFines() {
    const tbody = document.getElementById('member-fines-tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading fines...</td></tr>';
    
    try {
        const fines = await apiCall('/api/fines');
        if (fines.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No outstanding fines found. Congratulations!</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        fines.forEach(f => {
            tbody.innerHTML += `
                <tr>
                    <td>${f.title}</td>
                    <td><strong>$${f.amount.toFixed(2)}</strong></td>
                    <td>${f.payment_date || '—'}</td>
                    <td><span class="badge-status-item ${f.status === 'paid' ? 'returned' : 'overdue'}">${f.status}</span></td>
                </tr>
            `;
        });
    } catch (e) {}
}


// ==================================================
// STAFF PORTAL: DASHBOARD STATS & CHART.JS
// ==================================================

async function loadDashboardStats() {
    try {
        const stats = await apiCall('/api/reports/dashboard');
        
        document.getElementById('stat-total-books').textContent = stats.totalBooks;
        document.getElementById('stat-active-loans').textContent = stats.activeBorrowings;
        document.getElementById('stat-overdue-loans').textContent = stats.overdueBorrowings;
        document.getElementById('stat-fines-collected').textContent = `$${stats.totalFinesCollected.toFixed(2)}`;
        
        const visitsEl = document.getElementById('stat-total-visits');
        if (visitsEl) {
            visitsEl.textContent = stats.totalVisits || 0;
        }

        // Load or update Charts
        renderDashboardCharts(stats);
    } catch (e) {}
}

function renderDashboardCharts(stats) {
    const ctxBooks = document.getElementById('chart-top-books').getContext('2d');
    const ctxTrends = document.getElementById('chart-trends').getContext('2d');
    const ctxAttendance = document.getElementById('chart-attendance').getContext('2d');

    // Destroy existing charts if they exist
    if (charts.topBooks) charts.topBooks.destroy();
    if (charts.trends) charts.trends.destroy();
    if (charts.attendance) charts.attendance.destroy();

    // Chart colors tailored for premium UI
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#374151' : '#e2e8f0';
    const textColor = isDark ? '#9ca3af' : '#64748b';

    // Chart 1: Top Books Bar Chart
    const bookLabels = stats.topBooks.map(b => b.title.substring(0, 15) + (b.title.length > 15 ? '...' : ''));
    const bookData = stats.topBooks.map(b => b.count);

    charts.topBooks = new Chart(ctxBooks, {
        type: 'bar',
        data: {
            labels: bookLabels.length > 0 ? bookLabels : ['No Books Data'],
            datasets: [{
                label: 'Checkout Frequency',
                data: bookData.length > 0 ? bookData : [0],
                backgroundColor: 'rgba(99, 102, 241, 0.75)',
                borderColor: '#6366f1',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Chart 2: Borrow Trends Line Chart
    const trendLabels = stats.borrowingTrends.map(t => t.month);
    const trendData = stats.borrowingTrends.map(t => t.count);

    charts.trends = new Chart(ctxTrends, {
        type: 'line',
        data: {
            labels: trendLabels.length > 0 ? trendLabels : ['No Data'],
            datasets: [{
                label: 'Monthly Borrowings',
                data: trendData.length > 0 ? trendData : [0],
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: '#10b981',
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Chart 3: Hourly System Attendance Line Chart
    const hoursLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const hoursData = Array(24).fill(0);
    
    if (stats.hourlyVisits && stats.hourlyVisits.length > 0) {
        stats.hourlyVisits.forEach(v => {
            const h = parseInt(v.hour);
            if (h >= 0 && h < 24) {
                hoursData[h] = v.count;
            }
        });
    }

    charts.attendance = new Chart(ctxAttendance, {
        type: 'line',
        data: {
            labels: hoursLabels,
            datasets: [{
                label: 'System Traffic / Attendance (Hits)',
                data: hoursData,
                fill: true,
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                borderColor: '#0284c7',
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: '#0284c7'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Generate Exportable CSV/JSON reports
async function exportReport(format) {
    try {
        const borrowings = await apiCall('/api/borrowings');
        
        let content = '';
        let filename = `library_activity_${Date.now()}`;

        if (format === 'json') {
            content = JSON.stringify(borrowings, null, 2);
            filename += '.json';
            downloadFile(content, 'application/json', filename);
        } else {
            // Convert to CSV
            const headers = ['ID', 'Book Title', 'ISBN', 'Member Name', 'Borrow Date', 'Due Date', 'Return Date', 'Status', 'Fine Amount', 'Fine Status'];
            const rows = borrowings.map(b => [
                b.id,
                `"${b.title.replace(/"/g, '""')}"`,
                b.isbn,
                `"${b.member_name}"`,
                b.borrow_date,
                b.due_date,
                b.return_date || '—',
                b.status,
                b.fine_amount || 0,
                b.fine_status || '—'
            ]);
            
            content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            filename += '.csv';
            downloadFile(content, 'text/csv', filename);
        }
        showToast('Report exported successfully!');
    } catch (e) {}
}

function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// ==================================================
// STAFF PORTAL: MANAGE BOOKS
// ==================================================

async function loadManageBooks() {
    const tbody = document.getElementById('manage-books-tbody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading inventory...</td></tr>';
    
    try {
        const books = await apiCall('/api/books');
        tbody.innerHTML = '';
        if (books.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Inventory is empty. Add your first book above!</td></tr>';
            return;
        }

        books.forEach(b => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${b.title}</strong></td>
                    <td>${b.author}</td>
                    <td>${b.genre}</td>
                    <td><code>${b.isbn}</code></td>
                    <td>${b.total_copies}</td>
                    <td>${b.available_copies}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="editBookModal(${JSON.stringify(b).replace(/"/g, '&quot;')})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {}
}

async function handleBookSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('book-form-id').value;
    const bookData = {
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        genre: document.getElementById('book-genre').value,
        isbn: document.getElementById('book-isbn').value,
        total_copies: parseInt(document.getElementById('book-total-copies').value)
    };

    try {
        if (id) {
            await apiCall(`/api/books/${id}`, 'PUT', bookData);
            showToast('Book updated successfully.');
        } else {
            await apiCall('/api/books', 'POST', bookData);
            showToast('Book added successfully.');
        }
        closeModal('modal-book');
        loadManageBooks();
    } catch (e) {}
}

function editBookModal(book) {
    document.getElementById('book-form-id').value = book.id;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-author').value = book.author;
    document.getElementById('book-genre').value = book.genre;
    document.getElementById('book-isbn').value = book.isbn;
    document.getElementById('book-total-copies').value = book.total_copies;
    document.getElementById('book-modal-title').textContent = 'Modify Book Details';
    openModal('modal-book');
}

async function deleteBook(id) {
    if (!confirm('Are you sure you want to remove this book from catalog?')) return;
    try {
        await apiCall(`/api/books/${id}`, 'DELETE');
        showToast('Book removed successfully.');
        loadManageBooks();
    } catch (e) {}
}


// ==================================================
// STAFF PORTAL: MANAGE BORROWINGS (ISSUE & RETURNS)
// ==================================================

async function loadManageBorrowings() {
    const tbody = document.getElementById('manage-borrowings-tbody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading checkout history...</td></tr>';
    
    try {
        const borrows = await apiCall('/api/borrowings');
        tbody.innerHTML = '';
        if (borrows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No active checkout logs.</td></tr>';
            return;
        }

        borrows.forEach(b => {
            const returnBtn = b.status !== 'returned' 
                ? `<button class="btn btn-secondary btn-sm" onclick="returnBook(${b.id})">Return Book</button>` 
                : '—';
            
            const fineText = b.fine_amount ? `$${b.fine_amount.toFixed(2)} (${b.fine_status})` : '—';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${b.title}</strong></td>
                    <td>${b.member_name}</td>
                    <td>${b.borrow_date}</td>
                    <td>${b.due_date}</td>
                    <td>${b.return_date || '—'}</td>
                    <td><span class="badge-status-item ${b.status}">${b.status}</span></td>
                    <td>${fineText}</td>
                    <td>${returnBtn}</td>
                </tr>
            `;
        });
    } catch (e) {}
}

async function loadIssueDropdowns() {
    const bookSelect = document.getElementById('issue-book-select');
    const memberSelect = document.getElementById('issue-member-select');

    bookSelect.innerHTML = '<option value="">-- Choose Book --</option>';
    memberSelect.innerHTML = '<option value="">-- Choose Member --</option>';

    try {
        // Load available books
        const books = await apiCall('/api/books');
        books.forEach(b => {
            if (b.available_copies > 0) {
                bookSelect.innerHTML += `<option value="${b.id}">${b.title} (${b.available_copies} available)</option>`;
            }
        });

        // Load users to filter by Member role
        const users = await apiCall('/api/users');
        users.forEach(u => {
            if (u.role === 'member') {
                memberSelect.innerHTML += `<option value="${u.id}">${u.name} (@${u.username})</option>`;
            }
        });

        // Set default due date to 14 days from today
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 14);
        document.getElementById('issue-due-date').value = defaultDue.toISOString().split('T')[0];

    } catch (e) {}
}

async function handleIssueSubmit(e) {
    e.preventDefault();
    const issueData = {
        book_id: parseInt(document.getElementById('issue-book-select').value),
        member_id: parseInt(document.getElementById('issue-member-select').value),
        due_date: document.getElementById('issue-due-date').value
    };

    try {
        await apiCall('/api/borrowings', 'POST', issueData);
        showToast('Book issued successfully!');
        closeModal('modal-issue');
        loadManageBorrowings();
    } catch (e) {}
}

async function returnBook(borrowingId) {
    try {
        const response = await apiCall(`/api/borrowings/${borrowingId}/return`, 'POST');
        showToast(response.message);
        loadManageBorrowings();
    } catch (e) {}
}


// ==================================================
// STAFF PORTAL: MANAGE RESERVATIONS Waitlist
// ==================================================

async function loadManageReservations() {
    const tbody = document.getElementById('manage-resv-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading waitlist...</td></tr>';
    
    try {
        const resvs = await apiCall('/api/reservations');
        tbody.innerHTML = '';
        if (resvs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No active reservations.</td></tr>';
            return;
        }

        resvs.forEach(res => {
            // Fulfill reservation button (if book copies available)
            let fulfillBtn = '—';
            if (res.status === 'pending') {
                if (res.available_copies > 0) {
                    fulfillBtn = `<button class="btn btn-primary btn-sm" onclick="fulfillReservation(${res.id}, ${res.member_id}, '${res.title}')">Checkout</button>`;
                } else {
                    fulfillBtn = `<span style="font-size:12px; color: var(--text-secondary);">No copies available</span>`;
                }
            }

            tbody.innerHTML += `
                <tr>
                    <td><strong>${res.title}</strong><br><span style="font-size:12px; color: var(--text-secondary);">ISBN: ${res.isbn}</span></td>
                    <td>${res.member_name}</td>
                    <td>${res.reservation_date}</td>
                    <td><span class="badge-status-item ${res.status}">${res.status}</span></td>
                    <td>${res.available_copies} copies</td>
                    <td>${fulfillBtn}</td>
                </tr>
            `;
        });
    } catch (e) {}
}

function fulfillReservation(resvId, memberId, bookTitle) {
    // Fulfill reservation sets up Issue Form immediately
    openModal('modal-issue');
    loadIssueDropdowns().then(() => {
        // Find selecting option
        document.getElementById('issue-member-select').value = memberId;
        // Search and find matched book by Title in book options
        const select = document.getElementById('issue-book-select');
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.includes(bookTitle)) {
                select.selectedIndex = i;
                break;
            }
        }
    });
}


// ==================================================
// STAFF PORTAL: COLLECT FINES
// ==================================================

async function loadManageFines() {
    const tbody = document.getElementById('manage-fines-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading fines...</td></tr>';
    
    try {
        const fines = await apiCall('/api/fines');
        tbody.innerHTML = '';
        // Filter unpaid fines
        const unpaid = fines.filter(f => f.status === 'unpaid');
        
        if (unpaid.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No outstanding unpaid fines.</td></tr>';
            return;
        }

        unpaid.forEach(f => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${f.member_name}</strong><br><span style="font-size:11px;">@${f.member_email}</span></td>
                    <td>${f.title}</td>
                    <td><strong style="color: var(--danger-color);">$${f.amount.toFixed(2)}</strong></td>
                    <td><span class="badge-status-item overdue">Unpaid</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="collectFine(${f.id})">Collect Fine</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {}
}

async function collectFine(fineId) {
    if (!confirm('Record payment of fine?')) return;
    try {
        await apiCall(`/api/fines/${fineId}/pay`, 'POST');
        showToast('Payment recorded successfully.');
        loadManageFines();
    } catch (e) {}
}


// ==================================================
// STAFF PORTAL: USER ADMINISTRATION REGISTERS
// ==================================================

async function loadManageUsers() {
    const tbody = document.getElementById('manage-users-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading members register...</td></tr>';
    
    try {
        const users = await apiCall('/api/users');
        tbody.innerHTML = '';
        users.forEach(u => {
            let actions = '';
            
            // Allow Admins to delete other user accounts
            if (currentUser.role === 'admin' && u.id !== currentUser.id) {
                actions += `<button class="btn btn-danger btn-sm" style="margin-right: 6px;" onclick="deleteUser(${u.id}, '${u.name}')">Delete</button>`;
            }
            
            if (u.role === 'member') {
                actions += `<button class="btn btn-outline btn-sm" onclick="viewUserHistory(${u.id}, '${u.name}')">View History</button>`;
            }
            
            if (!actions) actions = '—';
            
            const studentDetails = u.role === 'member' && u.student_id 
                ? `<br><span style="font-size: 11px; color: var(--text-secondary);">Student ID: ${u.student_id} | Index: ${u.index_number || '—'}</span>` 
                : '';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${u.name}</strong>${studentDetails}</td>
                    <td><code>@${u.username}</code></td>
                    <td><span class="badge-role">${u.role}</span></td>
                    <td>${u.email}</td>
                    <td>${actions}</td>
                </tr>
            `;
        });
    } catch (e) {}
}

async function deleteUser(id, name) {
    if (!confirm(`Are you sure you want to permanently delete user: ${name}?`)) return;
    try {
        await apiCall(`/api/users/${id}`, 'DELETE');
        showToast('User deleted successfully.');
        loadManageUsers();
    } catch (e) {}
}

async function viewUserHistory(userId, memberName) {
    document.getElementById('history-modal-title').textContent = `${memberName} - Borrowing History`;
    const tbody = document.getElementById('member-history-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    openModal('modal-history');

    try {
        const history = await apiCall(`/api/users/${userId}/history`);
        tbody.innerHTML = '';
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No history found for this member.</td></tr>';
            return;
        }

        history.forEach(item => {
            const fineText = item.fine_amount ? `$${item.fine_amount.toFixed(2)} (${item.fine_status})` : '—';
            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.title}</strong></td>
                    <td>${item.borrow_date}</td>
                    <td>${item.due_date}</td>
                    <td>${item.return_date || '—'}</td>
                    <td><span class="badge-status-item ${item.status}">${item.status}</span></td>
                    <td>${fineText}</td>
                </tr>
            `;
        });
    } catch (e) {}
}

async function loadReportsCenter() {
    const reportType = document.getElementById('report-select-type').value;
    const thead = document.getElementById('report-table-thead');
    const tbody = document.getElementById('report-table-tbody');
    const title = document.getElementById('report-table-title');
    const timestamp = document.getElementById('report-timestamp');
    
    timestamp.textContent = `Generated: ${new Date().toLocaleString()}`;
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Compiling report records...</td></tr>';

    try {
        if (reportType === 'active-loans') {
            title.textContent = 'Active Borrowings Summary';
            thead.innerHTML = `
                <tr>
                    <th>Book Details</th>
                    <th>Member Details</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                </tr>
            `;
            
            const borrowings = await apiCall('/api/borrowings');
            const active = borrowings.filter(b => b.status === 'borrowed' || b.status === 'overdue');
            
            tbody.innerHTML = '';
            if (active.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No active library checkouts found.</td></tr>';
                return;
            }
            
            active.forEach(b => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${b.title}</strong><br><span style="font-size:12px; color:var(--text-secondary);">ISBN: ${b.isbn}</span></td>
                        <td><strong>${b.member_name}</strong><br><span style="font-size:12px; color:var(--text-secondary);">${b.member_email}</span></td>
                        <td>${b.borrow_date}</td>
                        <td>${b.due_date}</td>
                        <td><span class="badge-status-item ${b.status}">${b.status}</span></td>
                    </tr>
                `;
            });

        } else if (reportType === 'overdue-loans') {
            title.textContent = 'Overdue Book Violations Report';
            thead.innerHTML = `
                <tr>
                    <th>Book Title</th>
                    <th>Member Name</th>
                    <th>Due Date</th>
                    <th>Accumulated Fine</th>
                    <th>Status</th>
                </tr>
            `;
            
            const borrowings = await apiCall('/api/borrowings');
            const overdue = borrowings.filter(b => b.status === 'overdue');
            
            tbody.innerHTML = '';
            if (overdue.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Excellent! No books are currently overdue.</td></tr>';
                return;
            }
            
            overdue.forEach(b => {
                const fineVal = b.fine_amount ? `$${b.fine_amount.toFixed(2)}` : '$0.00';
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${b.title}</strong><br><span style="font-size:11px;">ISBN: ${b.isbn}</span></td>
                        <td><strong>${b.member_name}</strong><br><span style="font-size:11px;">${b.member_email}</span></td>
                        <td>${b.due_date}</td>
                        <td style="color: var(--danger-color); font-weight: bold;">${fineVal}</td>
                        <td><span class="badge-status-item overdue">${b.status}</span></td>
                    </tr>
                `;
            });

        } else if (reportType === 'fines-ledger') {
            title.textContent = 'Fines Ledger & Balances Statement';
            thead.innerHTML = `
                <tr>
                    <th>Member Details</th>
                    <th>Book Title</th>
                    <th>Fine Owed</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                </tr>
            `;
            
            const fines = await apiCall('/api/fines');
            
            tbody.innerHTML = '';
            if (fines.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No fines have been generated in this system.</td></tr>';
                return;
            }
            
            fines.forEach(f => {
                const dateText = f.payment_date || '—';
                const statusClass = f.status === 'paid' ? 'returned' : 'overdue';
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${f.member_name}</strong><br><span style="font-size:11px;">${f.member_email}</span></td>
                        <td>${f.title}</td>
                        <td style="font-weight: bold; color: ${f.status === 'unpaid' ? 'var(--danger-color)' : 'var(--success-color)'}">$${f.amount.toFixed(2)}</td>
                        <td>${dateText}</td>
                        <td><span class="badge-status-item ${statusClass}">${f.status}</span></td>
                    </tr>
                `;
            });

        } else if (reportType === 'popularity') {
            title.textContent = 'Book Popularity Metrics & Stats';
            thead.innerHTML = `
                <tr>
                    <th>Popularity Rank</th>
                    <th>Book Title</th>
                    <th>Genre Category</th>
                    <th>Times Borrowed</th>
                </tr>
            `;
            
            const stats = await apiCall('/api/reports/dashboard');
            
            tbody.innerHTML = '';
            if (!stats.topBooks || stats.topBooks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No borrow records registered yet to compile popularity rankings.</td></tr>';
                return;
            }
            
            stats.topBooks.forEach((b, index) => {
                let rankLabel = `#${index + 1}`;
                if (index === 0) rankLabel = '🏆 #1';
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${rankLabel}</strong></td>
                        <td><strong>${b.title}</strong></td>
                        <td><span class="badge-role" style="font-size:10px;">Popular Catalog</span></td>
                        <td><strong style="color: var(--accent-color);">${b.count} times</strong></td>
                    </tr>
                `;
            });
        } else if (reportType === 'roster-audit') {
            title.textContent = 'Classmate Enrollment Roster Audit Report';
            thead.innerHTML = `
                <tr>
                    <th>Classmate Name</th>
                    <th>Student ID</th>
                    <th>Index Number</th>
                    <th>Enrollment Status</th>
                    <th>Account Details</th>
                </tr>
            `;

            const data = await apiCall('/api/reports/roster-audit');
            
            tbody.innerHTML = `
                <tr style="background-color: var(--accent-light); font-weight: 600;">
                    <td colspan="5" style="text-align: center; padding: 12px; color: var(--accent-color);">
                        Roster Summary 📊 Total: ${data.stats.total} | Registered: ${data.stats.registered} (${data.stats.percentage}%) | Unregistered: ${data.stats.unregistered}
                    </td>
                </tr>
            `;

            if (data.roster.length === 0) {
                tbody.innerHTML += '<tr><td colspan="5" style="text-align: center;">Roster table is empty. Please run seed_roster.js first.</td></tr>';
                return;
            }

            data.roster.forEach(r => {
                const statusClass = r.status === 'registered' ? 'returned' : 'cancelled';
                const statusLabel = r.status === 'registered' ? 'Registered' : 'Pending Sign-up';
                const accountDetails = r.status === 'registered' 
                    ? `<strong>${r.username}</strong><br><span style="font-size:11px;">${r.email}</span>` 
                    : '<span style="color:var(--text-secondary); font-style:italic;">No account</span>';

                tbody.innerHTML += `
                    <tr>
                        <td><strong>${r.name}</strong></td>
                        <td>${r.student_id}</td>
                        <td>${r.index_number}</td>
                        <td><span class="badge-status-item ${statusClass}">${statusLabel}</span></td>
                        <td>${accountDetails}</td>
                    </tr>
                `;
            });
        } else if (reportType === 'circulation-log') {
            title.textContent = 'Shift Circulation Log Report';
            thead.innerHTML = `
                <tr>
                    <th>Date / Time</th>
                    <th>Book Details</th>
                    <th>Member Details</th>
                    <th>Activity Type</th>
                    <th>Current Status</th>
                </tr>
            `;

            const data = await apiCall('/api/reports/circulation-log');
            
            tbody.innerHTML = `
                <tr style="background-color: var(--accent-light); font-weight: 600;">
                    <td colspan="5" style="text-align: center; padding: 12px; color: var(--accent-color);">
                        Shift Activity Summary 📊 Total: ${data.stats.total} | Checkouts today: ${data.stats.checkouts} | Returns today: ${data.stats.returns}
                    </td>
                </tr>
            `;

            if (data.log.length === 0) {
                tbody.innerHTML += '<tr><td colspan="5" style="text-align: center;">No transactions processed on the current shift today.</td></tr>';
                return;
            }

            data.log.forEach(l => {
                const isReturn = l.return_date === data.stats.today;
                const activityClass = isReturn ? 'returned' : 'borrowed';
                const activityLabel = isReturn ? '<i class="fa-solid fa-arrow-left-long"></i> RETURN' : '<i class="fa-solid fa-arrow-right-long"></i> CHECKOUT';
                const transDate = isReturn ? l.return_date : l.borrow_date;
                
                let statusLabelClass = 'borrowed';
                if (l.status === 'returned') statusLabelClass = 'returned';
                if (l.status === 'overdue') statusLabelClass = 'overdue';

                tbody.innerHTML += `
                    <tr>
                        <td><strong>${transDate}</strong></td>
                        <td><strong>${l.book_title}</strong><br><span style="font-size:11px;">ISBN: ${l.isbn}</span></td>
                        <td><strong>${l.member_name}</strong><br><span style="font-size:11px;">${l.member_email}</span></td>
                        <td><span class="badge-status-item ${activityClass}">${activityLabel}</span></td>
                        <td><span class="badge-status-item ${statusLabelClass}">${l.status}</span></td>
                    </tr>
                `;
            });
        }
    } catch (err) {}
}

// ==================================================
// BORROWING POLICY ENFORCEMENT
// ==================================================

async function loadBorrowingRules() {
    try {
        // 1. Load active configurations
        const settings = await apiCall('/api/settings');
        
        document.getElementById('policy-max-loans').value = settings.max_loans || 3;
        document.getElementById('policy-block-fines').checked = settings.block_fines === '1';
        document.getElementById('policy-block-overdue').checked = settings.block_overdue === '1';

        // 2. Load blocked members list
        const blockedMembers = await apiCall('/api/reports/blocked-members');
        
        document.getElementById('policy-blocked-count').textContent = blockedMembers.length;

        const tbody = document.getElementById('policy-blocked-tbody');
        tbody.innerHTML = '';

        if (blockedMembers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--success-color); font-weight: 500;"><i class="fa-solid fa-circle-check"></i> All members currently comply with borrowing policies. No active blocks.</td></tr>';
            return;
        }

        blockedMembers.forEach(m => {
            const infractionsHTML = m.violations.map(v => `
                <div style="margin-bottom: 4px; color: var(--danger-color); font-weight: 500; font-size: 13px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> ${v}
                </div>
            `).join('');

            tbody.innerHTML += `
                <tr>
                    <td><strong>${m.name}</strong><br><span style="font-size: 11px; color: var(--text-secondary);">${m.email}</span></td>
                    <td><code>${m.student_id}</code></td>
                    <td><code>${m.index_number}</code></td>
                    <td>${infractionsHTML}</td>
                </tr>
            `;
        });
    } catch (err) {
        showToast('Failed to load borrowing policies registry.', 'error');
    }
}

async function handlePolicySettingsSubmit(e) {
    e.preventDefault();
    const max_loans = parseInt(document.getElementById('policy-max-loans').value, 10);
    const block_fines = document.getElementById('policy-block-fines').checked;
    const block_overdue = document.getElementById('policy-block-overdue').checked;

    try {
        const response = await apiCall('/api/settings', 'PUT', { max_loans, block_fines, block_overdue });
        showToast(response.message);
        loadBorrowingRules();
    } catch (err) {
        // Handled by apiCall
    }
}

async function loadRosterAuditPage() {
    try {
        const data = await apiCall('/api/reports/roster-audit');
        
        // Populate stats badges
        const badgesContainer = document.getElementById('roster-audit-stats-badges');
        badgesContainer.innerHTML = `
            <span class="badge-status-item available" style="font-weight:600; font-size:12px;">Total Classmates: ${data.stats.total}</span>
            <span class="badge-status-item returned" style="font-weight:600; font-size:12px;">Registered: ${data.stats.registered} (${data.stats.percentage}%)</span>
            <span class="badge-status-item overdue" style="font-weight:600; font-size:12px;">Pending Sign-up: ${data.stats.unregistered}</span>
        `;

        const tbody = document.getElementById('roster-audit-tbody');
        tbody.innerHTML = '';

        if (data.roster.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Master roster database is currently empty.</td></tr>';
            return;
        }

        data.roster.forEach(r => {
            const isRegistered = r.status === 'registered';
            const statusClass = isRegistered ? 'returned' : 'cancelled';
            const statusLabel = isRegistered ? 'Registered' : 'Pending Sign-up';
            const accountDetails = isRegistered 
                ? `<strong>${r.username}</strong><br><span style="font-size:11px; color:var(--text-secondary);">${r.email}</span>` 
                : '<span style="color:var(--text-secondary); font-style:italic;">No account created</span>';

            tbody.innerHTML += `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td><code>${r.student_id}</code></td>
                    <td><code>${r.index_number}</code></td>
                    <td><span class="badge-status-item ${statusClass}">${statusLabel}</span></td>
                    <td>${accountDetails}</td>
                </tr>
            `;
        });
    } catch (err) {
        showToast('Failed to load classmate enrollment roster.', 'error');
    }
}
