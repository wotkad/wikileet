import { setAuth, clearAuth, getState } from './state.js';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from './api.js';
import { initSocket, disconnectSocket, getSocket } from './socket.js';

function broadcastAuthMessage(type, data = {}) {
    const message = { type, ...data, timestamp: Date.now() };
    
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel('auth_sync');
            channel.postMessage(message);
            setTimeout(() => channel.close(), 100);
        } catch (error) {
            console.error('[Broadcast] Error:', error);
        }
    }
}

export async function login(email, password) {
    try {
        const data = await apiLogin(email, password);
        if (data && data.user) {
            setAuth(data.user);
            broadcastAuthMessage('login', { userId: data.user._id });
            
            setTimeout(async () => {
                const socket = await initSocket();
                if (socket && socket.connected) {
                    socket.emit('user:online');
                }
            }, 500);
            return data;
        }
        throw new Error('Login failed');
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
            broadcastAuthMessage('login', { userId: data.user._id });
            
            setTimeout(async () => {
                const socket = await initSocket();
                if (socket && socket.connected) {
                    socket.emit('user:online');
                }
            }, 500);
            return data;
        }
        throw new Error('Registration failed');
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

export async function logout() {
    try {
        console.log('[Auth] Logout started');
        
        // Отключаем WebSocket
        disconnectSocket();
        
        // Вызываем API logout
        await apiLogout();
        
        // Очищаем состояние
        clearAuth();
        
        // Отправляем сообщение другим вкладкам
        broadcastAuthMessage('logout');
        
        // Перенаправляем на главную
        if (window.router) {
            window.router.navigate('/');
        }
        
        console.log('[Auth] Logout completed');
    } catch (error) {
        console.error('Logout error:', error);
        clearAuth();
        disconnectSocket();
        broadcastAuthMessage('logout');
        if (window.router) {
            window.router.navigate('/');
        }
    }
}