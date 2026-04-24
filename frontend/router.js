import { getState } from './state.js';
import HomePage from './pages/home.js';
import WikiPage from './pages/wiki.js';
import ArticlePage from './pages/article.js';
import LoginPage from './pages/login.js';
import RegisterPage from './pages/register.js';
import Navbar from './components/navbar.js';

const state = getState();

const routes = {
    '/': HomePage,
    '/wiki': WikiPage,
    '/wiki/:slug': ArticlePage,
    '/login': LoginPage,
    '/register': RegisterPage,
};

const router = {
    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        this.handleRoute();
    },

    async handleRoute() {
        const path = window.location.pathname;
        const app = document.getElementById('app');
        
        let routeComponent = null;
        let params = {};

        for (const [routePath, Component] of Object.entries(routes)) {
            const routeRegex = new RegExp('^' + routePath.replace(/:\w+/g, '([^/]+)') + '$');
            const matches = path.match(routeRegex);
            
            if (matches) {
                routeComponent = Component;
                const paramNames = [...routePath.matchAll(/:(\w+)/g)].map(m => m[1]);
                paramNames.forEach((name, index) => {
                    params[name] = matches[index + 1];
                });
                break;
            }
        }

        if (!routeComponent) {
            // Перенаправляем на главную для неизвестных маршрутов
            window.location.href = '/';
            return;
        }

        const navbar = Navbar();
        const content = await routeComponent(params);
        
        app.innerHTML = `
            ${navbar}
            <main class="container mx-auto px-4 py-8 max-w-7xl">
                ${content}
            </main>
        `;

        // Навесить обработчик logoutBtn после рендера
        const btn = document.getElementById('logoutBtn');
        if (btn) {
            btn.onclick = () => {
                import('./auth.js').then(({ logout }) => {
                    logout();
                    this.navigate('/login');
                });
            };
        }
        if (state.currentUser && (path === '/login' || path === '/register')) {
            window.location.href = '/';
        }
    },

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }
};

// Делаем router глобальным для использования в onclick
window.router = router;

export default router;