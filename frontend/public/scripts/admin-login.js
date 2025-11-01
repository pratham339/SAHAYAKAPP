document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');

    if (!adminLoginForm) return; // safety

    adminLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const backendUrl = 'https://sahayakapp-k9rf.onrender.com';
            const response = await fetch(`${backendUrl}/api/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('adminData', JSON.stringify(data.admin));
                window.location.href = '/pages/admin-dashboard.html';
            } else {
                errorMessage.textContent = data.message || 'Admin login failed. Please try again.';
            }
        } catch (error) {
            console.error('Admin login request failed:', error);
            errorMessage.textContent = 'Could not connect to the server. Please try again later.';
        }
    });
});
