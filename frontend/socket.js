import { io } from 'https://cdn.socket.io/4.5.4/socket.io.esm.min.js';
import { getState } from './state.js';

let socket = null;
let onlineUsers = new Set();
let lastUpdateTime = 0;
let updateTimer = null;

export async function initSocket() {
    const state = getState();
    if (!state.currentUser) {
        console.log('[Socket] No user logged in');
        return null;
    }
    
    if (socket && socket.connected) {
        console.log('[Socket] Already connected');
        return socket;
    }
    
    console.log('[Socket] Initializing for:', state.currentUser.name);
    
    socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
        console.log('[Socket] Connected');
        // Не отправляем user:online сразу, даем время на инициализацию
        setTimeout(() => {
            if (socket && socket.connected) {
                socket.emit('user:online');
            }
        }, 100);
    });
    
    socket.on('users:online', (data) => {
        const now = Date.now();
        // Игнорируем слишком частые обновления (раз в 500ms)
        if (now - lastUpdateTime < 500) {
            console.log('[Socket] Ignoring too frequent update');
            return;
        }
        lastUpdateTime = now;
        
        const userIds = data.onlineUserIds || data;
        const newSet = new Set(userIds);
        
        // Проверяем, изменился ли список
        let changed = newSet.size !== onlineUsers.size;
        if (!changed) {
            for (const id of newSet) {
                if (!onlineUsers.has(id)) {
                    changed = true;
                    break;
                }
            }
        }
        
        if (changed) {
            console.log('[Socket] Online users changed:', Array.from(newSet));
            onlineUsers = newSet;
            
            // Отправляем событие обновления
            if (updateTimer) clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                const event = new CustomEvent('onlineUsersUpdated', { 
                    detail: { onlineUsers: Array.from(onlineUsers) } 
                });
                window.dispatchEvent(event);
                updateTimer = null;
            }, 100);
        }
    });
    
    socket.on('user:status', (data) => {
        console.log('[Socket] User status:', data.userId, data.online ? 'online' : 'offline');
        
        let changed = false;
        if (data.online) {
            if (!onlineUsers.has(data.userId)) {
                onlineUsers.add(data.userId);
                changed = true;
            }
        } else {
            if (onlineUsers.has(data.userId)) {
                onlineUsers.delete(data.userId);
                changed = true;
            }
        }
        
        if (changed && updateTimer === null) {
            updateTimer = setTimeout(() => {
                const event = new CustomEvent('onlineUsersUpdated', { 
                    detail: { onlineUsers: Array.from(onlineUsers) } 
                });
                window.dispatchEvent(event);
                updateTimer = null;
            }, 100);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
    });
    
    socket.on('connect_error', (error) => {
        console.error('[Socket] Error:', error);
    });
    
    return socket;
}

export function forceUpdateStatus() {
    if (socket && socket.connected) {
        console.log('[Socket] Force update');
        socket.emit('user:online');
    }
}

export function isUserOnline(userId) {
    return onlineUsers.has(userId);
}

export function getOnlineUsers() {
    return Array.from(onlineUsers);
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        onlineUsers.clear();
        if (updateTimer) {
            clearTimeout(updateTimer);
            updateTimer = null;
        }
    }
}

export function getSocket() {
    return socket;
}