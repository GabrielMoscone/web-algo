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

    document.addEventListener('DOMContentLoaded', () => {
        const btnCreate = document.getElementById('btnCriarSol');
        const selectSolutions = document.getElementById('solucoes');
        if (!btnCreate) return;

        btnCreate.addEventListener('click', async () => {
            const selProblemas = document.getElementById('problemas');
            const problemCode = selProblemas?.value?.trim();
            if (!problemCode) {
                alert('Selecione um problema antes de criar a solução.');
                return;
            }

            try {
                try {
                    mostra_tela_aguarde?.('Criando solução...');
                } catch {
                }
                const res = await api('/solutions', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({problemCode})
                });

                const newCode =
                    res?.code ?? res?.solutionCode ?? res?.id ?? res?.resposta ?? '';

                if (newCode && selectSolutions) {
                    const opt = document.createElement('option');
                    opt.value = newCode;
                    opt.textContent = newCode;
                    selectSolutions.appendChild(opt);
                    selectSolutions.value = newCode;
                }
            } catch (e) {
                console.error('Erro ao criar solução:', e);
                alert('Não foi possível criar a solução.');
            } finally {
                try {
                    esconde_tela_aguarde?.();
                } catch {
                }
            }
        });
    });
}
