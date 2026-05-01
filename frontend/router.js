import { initState, getState } from './state.js';
import HomePage from './pages/home.js';
import WikiPage from './pages/wiki.js';
import ArticlePage from './pages/article.js';
import LoginPage, { initLoginForm } from './pages/login.js';
import UserProfilePage from './pages/user-profile.js';
import RegisterPage, { initRegisterForm } from './pages/register.js';
import ProfilePage from './pages/profile.js';
import ArticlesListPage from './pages/admin/ArticlesList.js';
import ArticleEditPage from './pages/admin/ArticleEdit.js';
import Layout from './components/Layout.js';
import { updateHeaderUser } from './components/Header.js';
import { initSidebarEvents } from './components/Sidebar.js';
import { initAvatarUpload } from './components/AvatarUpload.js';
import UsersPage from './pages/users.js';

const routes = {
    '/': HomePage,
    '/wiki': WikiPage,
    '/wiki/:slug': ArticlePage,
    '/login': LoginPage,
    '/register': RegisterPage,
    '/profile': ProfilePage,
    '/profile/:slug': UserProfilePage,
    '/admin/articles': ArticlesListPage,
    '/admin/articles/new': ArticleEditPage,
    '/admin/articles/:slug': ArticleEditPage,
    '/users': UsersPage,
};

// Функции для инициализации профиля
let profileInitialized = false;

async function initProfileForms() {
    console.log('initProfileForms called');
    
    // Инициализация формы редактирования профиля
    const editForm = document.getElementById('editProfileForm');
    if (editForm && !editForm.hasAttribute('data-initialized')) {
        console.log('Initializing edit profile form');
        editForm.setAttribute('data-initialized', 'true');
        
        const newEditForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newEditForm, editForm);
        
        newEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-name')?.value;
            const email = document.getElementById('edit-email')?.value;
            
            if (!name || !email) {
                window.toast?.warning('Please fill in all fields');
                return;
            }
            
            try {
                const response = await fetch('/api/profile/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Update failed');
                }
                
                const user = await response.json();
                
                const { setState } = await import('./state.js');
                setState({ currentUser: user });
                
                const nameDisplay = document.getElementById('user-name-display');
                const emailDisplay = document.getElementById('user-email-display');
                if (nameDisplay) nameDisplay.textContent = user.name;
                if (emailDisplay) emailDisplay.textContent = user.email;
                
                updateHeaderUser();
                window.toast?.success('Profile updated successfully!');
            } catch (error) {
                console.error('Update profile error:', error);
                window.toast?.error(error.message);
            }
        });
    }
    
    // Инициализация формы смены пароля
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm && !passwordForm.hasAttribute('data-initialized')) {
        console.log('Initializing change password form');
        passwordForm.setAttribute('data-initialized', 'true');
        
        const newPasswordForm = passwordForm.cloneNode(true);
        passwordForm.parentNode.replaceChild(newPasswordForm, passwordForm);
        
        newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password')?.value;
            const newPassword = document.getElementById('new-password')?.value;
            const confirmPassword = document.getElementById('confirm-password')?.value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                window.toast?.warning('Please fill in all fields');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                window.toast?.warning('New passwords do not match');
                return;
            }
            
            if (newPassword.length < 6) {
                window.toast?.warning('Password must be at least 6 characters');
                return;
            }
            
            try {
                const response = await fetch('/api/profile/change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Password change failed');
                }
                
                const data = await response.json();
                
                if (data.user) {
                    const { setState } = await import('./state.js');
                    setState({ currentUser: data.user });
                    updateHeaderUser();
                }
                
                window.toast?.success('Password changed successfully!');
                newPasswordForm.reset();
            } catch (error) {
                console.error('Change password error:', error);
                window.toast?.error(error.message);
            }
        });
    }
}

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
        
        // Защита личного профиля
        if (path === '/profile' && !state.currentUser) {
            this.navigate('/login');
            return;
        }

        // Защита чужих профилей (только админы)
        if (path.startsWith('/profile/') && path !== '/profile') {
            if (!state.currentUser || state.currentUser.role !== 'admin') {
                this.navigate('/login');
                return;
            }
        }

        // Проверка для админки
        if (path.startsWith('/admin')) {
            if (!state.currentUser || state.currentUser.role !== 'admin') {
                this.navigate('/login');
                return;
            }
        }

        // Проверка для страницы пользователей (только админы)
        if (path === '/users') {
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
        initSidebarEvents();
        
        // Инициализация в зависимости от страницы
        if (path === '/login') {
            setTimeout(() => initLoginForm(), 50);
        } else if (path === '/register') {
            setTimeout(() => initRegisterForm(), 50);
        } else if (path === '/wiki' || path.startsWith('/wiki?')) {
            setTimeout(() => {
                if (window.initWikiEvents) {
                    window.initWikiEvents();
                }
            }, 50);
        } else if (path === '/admin/articles') {
            setTimeout(() => {
                if (window.initArticlesList) {
                    window.initArticlesList();
                }
            }, 50);
        } else if (path.startsWith('/admin/articles/')) {
            const slug = params.slug;
            setTimeout(() => {
                if (window.initArticleEdit) {
                    window.initArticleEdit(slug);
                }
            }, 50);
        } else if (path === '/profile') {
            // Очищаем предыдущий профиль
            const profileContent = document.getElementById('profile-content');
            if (profileContent) {
                profileContent.innerHTML = '<div class="text-center py-12">Загрузка профиля...</div>';
            }
            setTimeout(async () => {
                // Импортируем функцию инициализации профиля
                const { initProfilePage } = await import('../pages/profile.js');
                if (typeof initProfilePage === 'function') {
                    await initProfilePage();
                }
                initAvatarUpload();
                initProfileForms();
                profileInitialized = true;
            }, 150);
        } else if (path.startsWith('/profile/') && path !== '/profile') {
            // Публичный профиль не требует инициализации форм
            console.log('Public profile page, no forms to initialize');
        }
        else if (path === '/users') {
            setTimeout(() => {
                if (window.initUsersPage) {
                    window.initUsersPage();
                }
            }, 50);
        }
        
        this.bindEvents();
    },

    bindEvents() {
        // Дополнительные события
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