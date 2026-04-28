import { setAuth, clearAuth } from './state.js';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from './api.js';

export async function login(email, password) {
    try {
        console.log('auth.login called for:', email);
        const data = await apiLogin(email, password);
        console.log('auth.login response:', data);
        
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
        console.log('auth.register called for:', email);
        const data = await apiRegister(name, email, password);
        console.log('auth.register response:', data);
        
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
        console.log('auth.logout called');
        await apiLogout();
        clearAuth();
    } catch (error) {
        console.error('Logout error:', error);
        clearAuth();
    }
}