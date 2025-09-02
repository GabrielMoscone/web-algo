import { login } from './auth.js';

const form = document.getElementById('loginForm');
const err  = document.getElementById('err');

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.style.display = 'none';
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    try {
        await login(u, p);
        location.href = 'index.html';
    } catch (ex) {
        err.textContent = ex.message === '401' ? 'Usuário ou senha inválidos' : 'Falha no login';
        err.style.display = 'block';
    }
});