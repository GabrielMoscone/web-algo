import {api} from '../client/apiClient.js';

const form = document.getElementById('registerForm');
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        firstName: document.getElementById('rg_first').value.trim(),
        secondName: document.getElementById('rg_last').value.trim(),
        username: document.getElementById('rg_login').value.trim(),
        email: document.getElementById('rg_email').value.trim(),
        obs: document.getElementById('rg_role').value,
        gender: document.querySelector('input[name="rg_sex"]:checked').value,
        city: document.getElementById('rg_city').value.trim(),
        state: document.getElementById('rg_state').value.trim(),
        password: document.getElementById('rg_pwd').value
    };
    const pwd2 = document.getElementById('rg_pwd2').value;
    const eBox = document.getElementById('rg_err');
    const okBox = document.getElementById('rg_ok');
    eBox.style.display = okBox.style.display = 'none';

    if (payload.password !== pwd2) {
        eBox.textContent = 'As senhas não coincidem.';
        eBox.style.display = 'block';
        return;
    } else if (payload.password.length < 7 || payload.password.length > 10){
        eBox.textContent = 'A senha informada não atende aos critérios!';
        eBox.style.display = 'block';
        return;
    }

    try {
        await api('/auth/signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        okBox.textContent = 'Usuário criado com sucesso.';
        okBox.style.display = 'block';

        const el = document.getElementById('registerModal');
        bootstrap.Modal.getOrCreateInstance(el).hide();
    } catch (ex) {
        eBox.textContent = String(ex.message || 'Falha ao registrar usuário');
        eBox.style.display = 'block';
    }
});
