import {api} from '../client/apiClient.js';

const TYPE_TO_KEY = {
    'Sequencial': 'S',
    'Condicional': 'C',
    'Iterativo': 'I',
    'Vetores': 'V',
    'Matrizes': 'M',
    'Funções': 'F',
    'Recursividade': 'R',
    'Geral': 'G',
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

export function initProblemsUI({
                                   tipoSelectorId = 'tipoAlgoritmo',
                                   problemasSelectorId = 'problemas',
                                   carregarBtnSelector = '#buscarAlgoritmoModal .btn-primary',
                                   autoLoadOnStart = false,
                               } = {}) {
    const tipoEl = document.getElementById(tipoSelectorId);
    const probsEl = document.getElementById(problemasSelectorId);
    const carregarBtn = document.querySelector(carregarBtnSelector);

    async function refresh() {
        setLoading(probsEl, true);
        try {
            const label = tipoEl.value || tipoEl.options[tipoEl.selectedIndex]?.text;
            const codes = await loadProblemsByTypeLabel(label);
            fillOptions(probsEl, codes);
        } catch (e) {
            console.error('Falha ao carregar problemas:', e);
            probsEl.innerHTML = '<option>Erro ao carregar</option>';
        } finally {
            probsEl.disabled = false;
        }
    }

    tipoEl?.addEventListener('change', refresh);
    carregarBtn?.addEventListener('click', refresh);

    if (autoLoadOnStart) refresh();
}