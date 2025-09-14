import {api} from '../client/apiClient.js';

function putCodeIntoEditor(sourceCode = '') {
    const code = typeof sourceCode === 'string' ? sourceCode : '';
    if (window.editor?.setValue) {
        window.editor.setValue(code);
        window.editor.clearHistory?.();
    } else {
        const ta = document.getElementById('code');
        if (ta) ta.value = code;
    }
}

export function initSolutionsUI({
                                    selectId = 'solucoes',
                                    loadBtnId = 'btnCarregarSol'
                                } = {}) {
    const select = document.getElementById(selectId);
    const btn = document.getElementById(loadBtnId);
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const code = select?.value?.trim();
        if (!code) return;

        try {
            try {
                mostra_tela_aguarde?.('Carregando solução...');
            } catch {
            }

            const details = await api(`/solutions/${encodeURIComponent(code)}/details`);
            putCodeIntoEditor(details?.solution ?? '');

        } catch (e) {
            console.error('Erro ao carregar solução:', e);
        } finally {
            try {
                esconde_tela_aguarde?.();
            } catch {
            }
        }
    });
}
