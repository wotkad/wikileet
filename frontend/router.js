import { initState, getState } from './state.js';
import HomePage from './pages/home.js';
import WikiPage from './pages/wiki.js';
import ArticlePage from './pages/article.js';
import LoginPage, { initLoginForm } from './pages/login.js';
import RegisterPage, { initRegisterForm } from './pages/register.js';
import Layout from './components/Layout.js';
import { updateHeaderUser } from './components/Header.js';

const routes = {
    '/': HomePage,
    '/wiki': WikiPage,
    '/wiki/:slug': ArticlePage,
    '/login': LoginPage,
    '/register': RegisterPage,
};

const router = {
    init() {
        // Обработка кликов по ссылкам
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href') && 
                !link.getAttribute('href').startsWith('http') && 
                !link.getAttribute('target') &&
                link.getAttribute('href') !== '#') {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    this.navigate(href);
                }
            }
        });
        
        // Обработка навигации назад/вперед
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Запускаем роутинг
        this.handleRoute();
    },

    async handleRoute() {
        const path = window.location.pathname;
        const app = document.getElementById('app');
        
        let routeComponent = null;
        let params = {};
        let Component = null;

        for (const [routePath, Comp] of Object.entries(routes)) {
            const routeRegex = new RegExp('^' + routePath.replace(/:\w+/g, '([^/]+)') + '$');
            const matches = path.match(routeRegex);
            
            if (matches) {
                Component = Comp;
                const paramNames = [...routePath.matchAll(/:(\w+)/g)].map(m => m[1]);
                paramNames.forEach((name, index) => {
                    params[name] = matches[index + 1];
                });
                break;
            }
        }

        if (!Component) {
            this.navigate('/');
            return;
        }

        // Проверка авторизации для защищенных страниц
        const state = getState();
        if ((path === '/login' || path === '/register') && state.currentUser) {
            this.navigate('/');
            return;
        }

        // Рендерим layout и контент
        const content = await Component(params);
        const layout = Layout(content);
        app.innerHTML = layout;
        
        // Обновляем header
        updateHeaderUser();
        
        // Инициализируем формы для login и register
        if (path === '/login') {
            setTimeout(() => initLoginForm(), 0);
        } else if (path === '/register') {
            setTimeout(() => initRegisterForm(), 0);
        }
        
        // Для wiki страницы инициализируем события после рендера
        if (path === '/wiki' || path.startsWith('/wiki?')) {
            setTimeout(() => {
                if (window.initWikiEvents) {
                    window.initWikiEvents();
                }
            }, 0);
        }
        
        // Привязываем события
        this.bindEvents();
    },

    bindEvents() {
        // Обработка logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
            
            newBtn.onclick = async (e) => {
                e.preventDefault();
                const { logout } = await import('./auth.js');
                await logout();
                updateHeaderUser();
                this.navigate('/');
            };
        }
    },

    navigate(path) {
        if (window.location.pathname + window.location.search !== path) {
            window.history.pushState({}, '', path);
            this.handleRoute();
        }
    }
};

window.router = router;

export default router;