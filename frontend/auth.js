import { setAuth, clearAuth } from './state.js';
import { login as apiLogin, register as apiRegister } from './api.js';

export async function login(email, password) {
    const data = await apiLogin(email, password);
    setAuth(data.token, data.user);
    return data;
}

export async function register(name, email, password) {
    const data = await apiRegister(name, email, password);
    setAuth(data.token, data.user);
    return data;
}

export function logout() {
    clearAuth();
}