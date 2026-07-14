document.addEventListener('DOMContentLoaded', async () => {
    const resetForm = document.getElementById('reset-form');
    const tokenWelcome = document.getElementById('reset-token-welcome');
    
    // Parse query token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset_token');

    if (!token) {
        tokenWelcome.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> Recovery token missing or invalid.`;
        return;
    }

    try {
        // Verify token on server
        const res = await apiCall(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`, 'GET');
        tokenWelcome.innerHTML = `
            <i class="fa-solid fa-circle-info"></i>
            Resetting password for: <strong>${res.email}</strong>
        `;
        resetForm.classList.remove('hidden');
    } catch (err) {
        tokenWelcome.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> Reset token has expired or is invalid.`;
    }

    // Submit handler
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('reset-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;

        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        try {
            const data = await apiCall('/api/auth/reset-password', 'POST', { token, password });
            showToast(data.message || 'Password updated successfully!');
            resetForm.reset();
            resetForm.classList.add('hidden');
            tokenWelcome.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Reset completed! Redirecting...`;
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err) {
            // Handled by apiCall
        }
    });
});
