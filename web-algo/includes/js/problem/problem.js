import {api} from '../client/apiClient.js';

const TYPE_TO_KEY = {
    'Sequencial': 'S', 'Condicional': 'C', 'Iterativo': 'I',
    'Vetores': 'V', 'Matrizes': 'M', 'Funções': 'F',
    'Recursividade': 'R', 'Geral': 'G',
};

export async function loadProblemsByTypeLabel(label) {
    const key = TYPE_TO_KEY[label] || 'S';
    const data = await api(`/problems/key/${encodeURIComponent(key)}`);
    return Array.isArray(data) ? data : (data?.codes ?? []);
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
    return api(`/problems/${encodeURIComponent(code)}/details`);
}

function renderProblemDetails(data) {
    const qTitle = document.getElementById('question');
    if (qTitle) qTitle.textContent = data?.description ?? '—';

    const exampleTexts = document.querySelectorAll('#questao .example-text');
    if (exampleTexts[0]) setTextWithBreaks(exampleTexts[0], data?.input);
    if (exampleTexts[1]) setTextWithBreaks(exampleTexts[1], data?.output);

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