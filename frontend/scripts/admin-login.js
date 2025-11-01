document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');

    if (!adminLoginForm) return; // safety

    adminLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        console.log('📧 Email (trimmed):', email);
        console.log('🔐 Password length:', password.length);

        try {
            const backendUrl = 'https://sahayakapp-k9rf.onrender.com';
            const payload = { email, password };
            console.log('📤 Sending payload:', payload);
            
            const response = await fetch(`${backendUrl}/api/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('📥 Response status:', response.status);
            const data = await response.json();
            console.log('📋 Response data:', data);

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('adminData', JSON.stringify(data.admin));
                // Redirect to home which will show dashboard
                window.location.href = '/';
            } else {
                errorMessage.textContent = data.message || 'Admin login failed. Please try again.';
            }
        } catch (error) {
            console.error('Admin login request failed:', error);
            errorMessage.textContent = 'Could not connect to the server. Please try again later.';
        }
    });
});
