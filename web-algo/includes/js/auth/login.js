import { login } from './auth.js';
import { mostra_tela_aguarde, esconde_tela_aguarde } from '../utils.js';

const form = document.getElementById('loginForm');
const err  = document.getElementById('err');

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.style.display = 'none';
    mostra_tela_aguarde('Autenticando...');
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    try {
        await login(u, p);
        location.href = 'index.html';
    } catch (ex) {
        err.textContent = ex.message === '401' ? 'Usuário ou senha inválidos' : 'Falha no login';
        err.style.display = 'block';
    } finally {
        esconde_tela_aguarde();
    }
});