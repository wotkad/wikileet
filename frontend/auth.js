import { setAuth, clearAuth } from './state.js';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from './api.js';

export async function login(email, password) {
    const data = await apiLogin(email, password);
    if (data.user) {
        setAuth(data.user);
    }
    return data;
}

export async function register(name, email, password) {
    const data = await apiRegister(name, email, password);
    if (data.user) {
        setAuth(data.user);
    }
    return data;
}

export async function logout() {
    await apiLogout();
    clearAuth();
}