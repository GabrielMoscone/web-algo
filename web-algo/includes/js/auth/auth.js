import {api} from '../client/apiClient.js';
import {USER_STORAGE_KEY} from '../client/config.js';

function setLegacyNameCookie(username) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `name=${encodeURIComponent(username)}; Path=/; SameSite=Lax${secure}`;
}

function clearLegacyCookies() {
    document.cookie = 'sessionid=; Path=/; Max-Age=0';
    document.cookie = 'name=; Path=/; Max-Age=0';
}

export function getCurrentUser() {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export async function login(username, password) {
    const body = JSON.stringify({username, password});
    const res = await api('/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body
    });

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({username}));
    setLegacyNameCookie(username);
    return res;
}

export async function logout() {
    const user = getCurrentUser();
    try {
        await api('/auth/logout', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user?.username})
        });
    } catch (e) {
        console.warn('Falha no logout do servidor:', e);
    } finally {
        localStorage.removeItem(USER_STORAGE_KEY);
        clearLegacyCookies();
    }
}

export function isAuthenticated() {
    return !!localStorage.getItem(USER_STORAGE_KEY);
}
