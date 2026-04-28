import router from './router.js';
import { initState, getState, clearAuth } from './state.js';
import { initSocket, disconnectSocket } from './socket.js';

// Функция для получения текущего состояния из других вкладок
function setupCrossTabSync() {
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('auth_sync');
        channel.onmessage = (event) => {
            console.log('[CrossTab] Message received:', event.data);
            
            if (event.data.type === 'login') {
                console.log('[CrossTab] User logged in in another tab, updating state...');
                // Перезагружаем состояние
                initState().then(() => {
                    const state = getState();
                    if (state.currentUser) {
                        initSocket();
                    }
                    // Обновляем текущую страницу
                    if (window.router) {
                        window.router.handleRoute();
                    }
                });
            } else if (event.data.type === 'logout') {
                console.log('[CrossTab] User logged out in another tab, clearing state...');
                // Отключаем WebSocket
                disconnectSocket();
                // Очищаем состояние
                clearAuth();
                // Обновляем текущую страницу
                if (window.router) {
                    window.router.handleRoute();
                }
                // Показываем уведомление
                if (window.toast) {
                    window.toast.info('You have been logged out in another tab');
                }
            } else if (event.data.type === 'status_update') {
                console.log('[CrossTab] Status update from another tab, refreshing...');
                const event = new CustomEvent('onlineUsersUpdated');
                window.dispatchEvent(event);
            }
        };
        console.log('[CrossTab] BroadcastChannel initialized');
    } else {
        // Fallback для старых браузеров
        window.addEventListener('storage', (event) => {
            if (event.key === 'auth_sync' && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    console.log('[CrossTab] Storage event:', data);
                    
                    if (data.type === 'login') {
                        initState().then(() => {
                            const state = getState();
                            if (state.currentUser) {
                                initSocket();
                            }
                            if (window.router) {
                                window.router.handleRoute();
                            }
                        });
                    } else if (data.type === 'logout') {
                        disconnectSocket();
                        clearAuth();
                        if (window.router) {
                            window.router.handleRoute();
                        }
                    }
                } catch (error) {
                    console.error('[CrossTab] Error parsing storage event:', error);
                }
            }
        });
    }
}

class App {
    constructor() {
        this.init();
    }

    async init() {
        // Настраиваем синхронизацию между вкладками
        setupCrossTabSync();
        
        await initState();
        router.init();
        
        const state = getState();
        if (state.currentUser) {
            console.log('User is logged in, initializing socket');
            await initSocket();
        } else {
            console.log('No user logged in, skipping socket init');
        }
    }
}

new App();