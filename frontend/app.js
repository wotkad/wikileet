import router from './router.js';
import { initState, subscribe } from './state.js';
import { logout } from './auth.js';

window.logout = logout;

function bindNavbarEvents() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;

    btn.onclick = () => {
        logout();
        router.navigate('/login');
    };
}

class App {
    constructor() {
        this.init();
    }

    async init() {
        await initState();
        router.init();

        subscribe(() => {
            bindNavbarEvents();
        });

        bindNavbarEvents();
    }
}

new App();