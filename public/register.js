document.addEventListener('DOMContentLoaded', () => {
    let verifiedStudentName = '';
    const registerForm = document.getElementById('register-form');
    const step1 = document.getElementById('reg-step-1');
    const step2 = document.getElementById('reg-step-2');
    const welcomeBanner = document.getElementById('reg-verified-welcome');

    // Enforce numbers-only inputs as user types
    const restrictToDigits = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    };
    
    ['reg-student-id', 'reg-index-number'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', restrictToDigits);
    });

    // Step 1: Next handler
    document.getElementById('btn-reg-next').addEventListener('click', async () => {
        const student_id = document.getElementById('reg-student-id').value.trim();
        const index_number = document.getElementById('reg-index-number').value.trim();

        if (!student_id || !index_number) {
            showToast('Please enter both Student ID and Index Number.', 'error');
            return;
        }

        try {
            const data = await apiCall('/api/auth/verify-roster', 'POST', { student_id, index_number });
            verifiedStudentName = data.name;

            welcomeBanner.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                Identity Verified: <strong>${data.name}</strong>
            `;
            
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
        } catch (err) {
            // Handled by apiCall
        }
    });

    // Step 2: Back handler
    document.getElementById('btn-reg-back').addEventListener('click', () => {
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        verifiedStudentName = '';
    });

    // Submit handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const student_id = document.getElementById('reg-student-id').value.trim();
        const index_number = document.getElementById('reg-index-number').value.trim();

        if (!verifiedStudentName) {
            showToast('Student identity not verified. Please complete Step 1.', 'error');
            return;
        }

        if (!email.endsWith('@gmail.com')) {
            showToast('Only Gmail addresses (@gmail.com) are accepted.', 'error');
            return;
        }

        try {
            const res = await apiCall('/api/auth/register', 'POST', {
                username,
                password,
                role: 'member',
                name: verifiedStudentName,
                email,
                student_id,
                index_number
            });

            showToast(res.message || 'Registration successful! Verification email sent.');
            registerForm.reset();
            step2.classList.add('hidden');
            step1.classList.remove('hidden');
            verifiedStudentName = '';

            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err) {
            // Handled by apiCall
        }
    });
});
