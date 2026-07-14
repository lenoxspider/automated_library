document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');
    const loginCard = document.getElementById('login-card');
    const forgotCard = document.getElementById('forgot-card');

    // Toggle panels
    document.getElementById('toggle-forgot').addEventListener('click', () => {
        loginCard.classList.add('hidden');
        forgotCard.classList.remove('hidden');
    });

    document.getElementById('toggle-login').addEventListener('click', () => {
        forgotCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
    });

    // Enforce numbers-only on recovery inputs as user types
    const restrictToDigits = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    };
    
    ['forgot-student-id', 'forgot-index-number'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', restrictToDigits);
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const data = await apiCall('/api/auth/login', 'POST', { username, password });
            localStorage.setItem('smartlib_token', data.token);
            localStorage.setItem('smartlib_user', JSON.stringify(data.user));
            
            showToast('Login successful!');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (err) {
            // Toast automatically triggered by apiCall
        }
    });

    // Handle Forgot Password
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const student_id = document.getElementById('forgot-student-id').value;
        const index_number = document.getElementById('forgot-index-number').value;

        try {
            const data = await apiCall('/api/auth/forgot-password', 'POST', { student_id, index_number });
            showToast(data.message || 'Recovery email sent successfully!');
            forgotForm.reset();
            
            // Toggle back to login card
            forgotCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
        } catch (err) {
            // Handled by apiCall
        }
    });
});
