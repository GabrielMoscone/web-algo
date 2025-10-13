import {api} from '../client/apiClient.js';
import { mostra_tela_aguarde, esconde_tela_aguarde } from '../utils.js';

const TYPE_TO_KEY = {
    'Sequencial': 'S', 'Condicional': 'C', 'Iterativo': 'I',
    'Vetores': 'V', 'Matrizes': 'M', 'Funções': 'F',
    'Recursividade': 'R', 'Geral': 'G',
};

export async function loadProblemsByTypeLabel(label) {
    mostra_tela_aguarde('Carregando problemas...');
    try {
        const key = TYPE_TO_KEY[label] || 'S';
        const data = await api(`/problems/key/${encodeURIComponent(key)}`);
        return Array.isArray(data) ? data : (data?.codes ?? []);
    } finally {
        esconde_tela_aguarde();
    }
}

function setLoading(select, loading) {
    select.disabled = loading;
    select.innerHTML = loading ? '<option>Carregando...</option>' : '';
}

function fillOptions(select, codes) {
    select.innerHTML = '';
    if (!codes || !codes.length) {
        select.innerHTML = '<option>Nenhum encontrado</option>';
        return;
    }
    for (const c of codes) {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    }
}

function escapeHtml(s = '') {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function setTextWithBreaks(el, value) {
    el.innerHTML = escapeHtml(value ?? '').replace(/\r?\n/g, '<br>');
}

async function loadProblemDetailsByCode(code) {
    mostra_tela_aguarde('Carregando detalhes...');
    try {
        return await api(`/problems/${encodeURIComponent(code)}/details`);
    } finally {
        esconde_tela_aguarde();
    }
}

function renderProblemDetails(data) {
    const qTitle = document.getElementById('question');
    if (qTitle) qTitle.textContent = data?.description ?? '—';

    const inputEl = document.getElementById('example-input');
    if (inputEl) setTextWithBreaks(inputEl, data?.input);

    const outputEl = document.getElementById('example-output');
    if (outputEl) setTextWithBreaks(outputEl, data?.output);

    const costEl = document.getElementById('example-cost');
    if (costEl) setTextWithBreaks(costEl, data?.cost);

    const solucoesSelect = document.getElementById('solucoes');
    if (solucoesSelect) {
        fillSolutionOptions(solucoesSelect, data?.solutions);
        if (solucoesSelect.options.length && !solucoesSelect.value) {
            solucoesSelect.selectedIndex = 0;
        }
    }

    const tbody = document.querySelector('#tabela_ranking tbody');
    if (tbody) {
        const list = Array.isArray(data?.ranking) ? data.ranking : [];
        if (list.length) {
            tbody.innerHTML = list
                .map((nome, i) =>
                    `<tr>
             <td style="text-align:center;">${i + 1}</td>
             <td>${escapeHtml(nome)}</td>
           </tr>`
                )
                .join('');
        } else {
            tbody.innerHTML = `
        <tr>
          <td colspan="2" style="text-align:center; color: var(--text-secondary);">
            Nenhum ranking disponível
          </td>
        </tr>`;
        }
    }

    if (typeof fecha_modal === 'function') {
        fecha_modal('buscarAlgoritmoModal');
    }
}

export function initProblemsUI({
                                   tipoSelectorId = 'tipoAlgoritmo',
                                   problemasSelectorId = 'problemas',
                                   carregarBtnSelector = '#buscarAlgoritmoModal .btn-primary',
                                   autoLoadOnStart = false,
                                   fetchDefaultOnOpen = false,
                                   defaultCode = 'S00000050',
                               } = {}) {
    const tipoEl = document.getElementById(tipoSelectorId);
    const probsEl = document.getElementById(problemasSelectorId);
    const carregarBtn = document.querySelector(carregarBtnSelector);

    async function refreshList() {
        setLoading(probsEl, true);
        try {
            const label = tipoEl.value || tipoEl.options[tipoEl.selectedIndex]?.text;
            const codes = await loadProblemsByTypeLabel(label);
            fillOptions(probsEl, codes);
            return codes;
        } catch (e) {
            console.error('Falha ao carregar problemas:', e);
            probsEl.innerHTML = '<option>Erro ao carregar</option>';
            return [];
        } finally {
            probsEl.disabled = false;
        }
    }

    tipoEl?.addEventListener('change', refreshList);

    carregarBtn?.addEventListener('click', async () => {
        const code = probsEl?.value?.trim();
        if (!code) return;
        try {
            const details = await loadProblemDetailsByCode(code);
            renderProblemDetails(details);
        } catch (e) {
            console.error('Falha ao carregar detalhes do problema:', e);
        }
    });

    (async () => {
        let codes = [];
        if (autoLoadOnStart) {
            codes = await refreshList();
        }

        if (fetchDefaultOnOpen) {
            if (defaultCode && codes.includes(defaultCode)) {
                probsEl.value = defaultCode;
            }
            const codeToLoad = defaultCode || probsEl?.value?.trim();
            if (codeToLoad) {
                try {
                    const details = await loadProblemDetailsByCode(codeToLoad);
                    renderProblemDetails(details);
                } catch (e) {
                    console.error('Falha ao carregar exercício padrão:', e);
                }
            }
        }
    })();
}

function fillSolutionOptions(select, solutions) {
    select.innerHTML = '';
    const list = Array.isArray(solutions) ? solutions : [];

    if (!list.length) {
        select.innerHTML = '<option value="">Nenhum encontrado</option>';
        return;
    }

    for (const item of list) {
        const code = typeof item === 'string' ? item : item?.code;
        const label = typeof item === 'string' ? item : (item?.label || item?.code);
        if (!code) continue;
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = label ?? code;
        select.appendChild(opt);
    }
}