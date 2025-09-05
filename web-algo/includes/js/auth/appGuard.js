import { isAuthenticated, logout } from './auth.js';

if (!isAuthenticated()) {
    location.replace('login.html');
}

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
            location.replace('login.html');
        });
    }
});
