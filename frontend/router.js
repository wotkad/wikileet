import { initState, getState } from './state.js';
import HomePage from './pages/home.js';
import WikiPage from './pages/wiki.js';
import ArticlePage from './pages/article.js';
import LoginPage, { initLoginForm } from './pages/login.js';
import RegisterPage, { initRegisterForm } from './pages/register.js';
import ProfilePage from './pages/profile.js';
import ArticlesListPage from './pages/admin/ArticlesList.js';
import ArticleEditPage from './pages/admin/ArticleEdit.js';
import Layout from './components/Layout.js';
import { updateHeaderUser } from './components/Header.js';
import { initSidebarEvents } from './components/Sidebar.js';

const routes = {
    '/': HomePage,
    '/wiki': WikiPage,
    '/wiki/:slug': ArticlePage,
    '/login': LoginPage,
    '/register': RegisterPage,
    '/profile': ProfilePage,
    '/admin/articles': ArticlesListPage,
    '/admin/articles/new': ArticleEditPage,
    '/admin/articles/:slug': ArticleEditPage,
};

const router = {
    init() {
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
        
        window.addEventListener('popstate', () => this.handleRoute());
        this.handleRoute();
    },

    async handleRoute() {
        const path = window.location.pathname;
        const app = document.getElementById('app');
        
        let Component = null;
        let params = {};

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

        const state = getState();
        
        if (path === '/profile' && !state.currentUser) {
            this.navigate('/login');
            return;
        }
        
        if (path.startsWith('/admin')) {
            if (!state.currentUser || state.currentUser.role !== 'admin') {
                this.navigate('/login');
                return;
            }
        }
        
        if ((path === '/login' || path === '/register') && state.currentUser) {
            this.navigate('/');
            return;
        }

        const content = await Component(params);
        const layout = Layout(content);
        app.innerHTML = layout;
        
        updateHeaderUser();
        
        // Инициализируем sidebar события после рендера
        setTimeout(() => {
            initSidebarEvents();
        }, 100);
        
        if (path === '/login') {
            setTimeout(() => initLoginForm(), 0);
        } else if (path === '/register') {
            setTimeout(() => initRegisterForm(), 0);
        } else if (path === '/wiki' || path.startsWith('/wiki?')) {
            setTimeout(() => {
                if (window.initWikiEvents) {
                    window.initWikiEvents();
                }
            }, 0);
        } else if (path === '/admin/articles') {
            setTimeout(() => {
                if (window.initArticlesList) {
                    window.initArticlesList();
                }
            }, 0);
        } else if (path.startsWith('/admin/articles/')) {
            const slug = params.slug;
            setTimeout(() => {
                if (window.initArticleEdit) {
                    window.initArticleEdit(slug);
                }
            }, 0);
        }
        
        this.bindEvents();
    },

    bindEvents() {
        // Дополнительные события если нужны
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