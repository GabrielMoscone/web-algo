import {api} from '../client/apiClient.js';
import { mostra_tela_aguarde, esconde_tela_aguarde } from '../utils.js';

const form = document.getElementById('changePwdForm');
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('cp_username').value.trim();
    const old = document.getElementById('cp_old').value;
    const np = document.getElementById('cp_new').value;
    const np2 = document.getElementById('cp_new2').value;
    const eBox = document.getElementById('cp_err');
    const okBox = document.getElementById('cp_ok');
    eBox.style.display = okBox.style.display = 'none';

    if (np !== np2) {
        eBox.textContent = 'As senhas novas não coincidem.';
        eBox.style.display = 'block';
        return;
    } else if (np.length < 7 || np.length > 10){
        eBox.textContent = 'A senha informada não atende aos critérios!';
        eBox.style.display = 'block';
        return;
    }

    mostra_tela_aguarde('Alterando senha...');
    try {
        await api('/auth/change-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, currentPassword: old, newPassword: np})
        });
        okBox.textContent = 'Senha alterada com sucesso.';
        okBox.style.display = 'block';

        window.location.replace('/login.html')
    } catch (ex) {
        eBox.textContent = String(ex.message || 'Falha ao alterar senha');
        eBox.style.display = 'block';
    } finally {
        esconde_tela_aguarde();
    }
});
