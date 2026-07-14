document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Check (Change Sign In button to Dashboard button if logged in)
    const token = localStorage.getItem('smartlib_token');
    const authBtn = document.getElementById('nav-auth-btn');
    if (token && authBtn) {
        authBtn.textContent = 'Go to Dashboard';
        authBtn.href = '/dashboard';
        authBtn.className = 'btn btn-outline';
    }

    // 2. Track Site Visit Telemetry
    trackSiteVisit();

    // 3. Load Book Catalog
    loadCatalog();

    // Add search input keyup handler
    const searchInput = document.getElementById('catalog-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loadCatalog(e.target.value.trim());
        });
    }
});

async function trackSiteVisit() {
    try {
        await fetch('/api/analytics/visit', { method: 'POST' });
    } catch (err) {
        console.error('Failed to log telemetry event:', err);
    }
}

async function loadCatalog(searchQuery = '') {
    const grid = document.getElementById('catalog-books-grid');
    if (!grid) return;

    let url = '/api/books';
    if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
    }

    try {
        const books = await apiCall(url);
        
        if (books.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; width: 100%; color: var(--text-secondary); grid-column: 1 / -1; padding: 40px 0;">
                    <i class="fa-solid fa-book-open" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <p>No books matching "${searchQuery}" found in the catalog.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = books.map(book => {
            const isAvailable = book.available_copies > 0;
            return `
                <div class="book-card">
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p class="author">By ${book.author}</p>
                        <p class="genre"><i class="fa-solid fa-tags"></i> ${book.genre}</p>
                        <p class="isbn" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                            ISBN: <strong>${book.isbn}</strong>
                        </p>
                    </div>
                    <div class="book-meta">
                        <span class="badge-status ${isAvailable ? 'available' : 'unavailable'}">
                            ${isAvailable ? `${book.available_copies} of ${book.total_copies} Available` : 'Fully Checked Out'}
                        </span>
                        <a href="/login" class="btn btn-sm btn-outline" style="text-decoration: none;">
                            <i class="fa-solid fa-right-to-bracket"></i> Login to borrow
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        grid.innerHTML = `
            <div style="text-align: center; width: 100%; color: var(--danger-color); grid-column: 1 / -1; padding: 40px 0;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p>Failed to retrieve catalog data. Check server connectivity.</p>
            </div>
        `;
    }
}
