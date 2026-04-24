import { getState } from './state.js';
import HomePage from './pages/home.js';
import WikiPage from './pages/wiki.js';
import ArticlePage from './pages/article.js';
import LoginPage from './pages/login.js';
import RegisterPage from './pages/register.js';
import Navbar from './components/navbar.js';

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
            if (link && link.getAttribute('href') && !link.getAttribute('href').startsWith('http') && !link.getAttribute('target')) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    this.navigate(href);
                }
            }
        });
        
        // Обработка навигации назад/вперед
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Обработка отправки форм
        document.body.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin(e.target);
            } else if (e.target.id === 'registerForm') {
                e.preventDefault();
                this.handleRegister(e.target);
            }
        });
        
        // Запускаем роутинг
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
            this.navigate('/');
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

        // Привязываем события после рендера
        this.bindEvents();
    },

    async handleLogin(form) {
        const email = form.querySelector('#email')?.value;
        const password = form.querySelector('#password')?.value;
        const errorMsg = form.querySelector('#errorMsg');
        
        if (!email || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Please fill in all fields';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        try {
            const { login } = await import('./auth.js');
            await login(email, password);
            this.navigate('/');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = 'Invalid email or password';
                errorMsg.classList.remove('hidden');
            }
        }
    },

    async handleRegister(form) {
        const name = form.querySelector('#name')?.value;
        const email = form.querySelector('#email')?.value;
        const password = form.querySelector('#password')?.value;
        const errorMsg = form.querySelector('#errorMsg');
        
        if (!name || !email || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Please fill in all fields';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (name.length < 2) {
            if (errorMsg) {
                errorMsg.textContent = 'Name must be at least 2 characters';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (password.length < 6) {
            if (errorMsg) {
                errorMsg.textContent = 'Password must be at least 6 characters';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        try {
            const { register } = await import('./auth.js');
            await register(name, email, password);
            this.navigate('/');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Registration failed';
                errorMsg.classList.remove('hidden');
            }
        }
    },

    bindEvents() {
        // Обработка logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = async (e) => {
                e.preventDefault();
                const { logout } = await import('./auth.js');
                logout();
                this.navigate('/login');
            };
        }
    },

    navigate(path) {
        if (window.location.pathname !== path) {
            window.history.pushState({}, '', path);
            this.handleRoute();
        }
    }
};

window.router = router;

export default router;