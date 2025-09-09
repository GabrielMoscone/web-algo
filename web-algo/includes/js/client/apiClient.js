import {BASE_URL} from './config.js';

// Sempre manda o cookie de sessão
export async function api(path, { method = 'GET', headers = {}, body } = {}) {
    const resp = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body,
        credentials: 'include'
    });

    // pega o corpo uma vez (pode ser JSON ou texto)
    const raw = await resp.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = raw; }

    if (!resp.ok) {
        const msg = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
        throw new Error(`${resp.status}:${msg}`);
    }
    return data;
}
