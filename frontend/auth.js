import { setAuth, clearAuth } from './state.js';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from './api.js';

export async function login(email, password) {
    try {
        const data = await apiLogin(email, password);
        if (data && data.user) {
            setAuth(data.user);
            return data;
        }
        throw new Error('Login failed - no user data');
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function register(name, email, password) {
    try {
        const data = await apiRegister(name, email, password);
        if (data && data.user) {
            setAuth(data.user);
            return data;
        }
        throw new Error('Registration failed - no user data');
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

export async function logout() {
    try {
        console.log('Auth.logout called');
        await apiLogout();
        console.log('API logout successful');
        clearAuth();
        console.log('Auth cleared');
    } catch (error) {
        console.error('Logout error:', error);
        // Даже если ошибка, очищаем состояние
        clearAuth();
    }
}