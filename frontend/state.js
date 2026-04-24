import { getCategories, getTags, getUser } from './api.js';

let state = {
    currentUser: null,
    token: localStorage.getItem('token'),
    categories: [],
    tags: [],
};

const listeners = [];

export function getState() {
    return { ...state };
}

export function setState(newState) {
    state = { ...state, ...newState };
    console.log('State updated:', state);
    listeners.forEach(listener => listener(state));
    
    // Обновляем navbar без перезагрузки
    const navbar = document.querySelector('nav');
    if (navbar && window.router) {
        import('./components/navbar.js').then(module => {
            const newNavbar = module.default();
            navbar.replaceWith(document.createRange().createContextualFragment(newNavbar).firstChild);
            window.router.bindEvents();
        });
    }
}

export function setAuth(token, user) {
    localStorage.setItem('token', token);
    setState({ token, currentUser: user });
}

export function clearAuth() {
    localStorage.removeItem('token');
    setState({ token: null, currentUser: null });
}

export function subscribe(listener) {
    listeners.push(listener);
}

export async function initState() {
    const token = localStorage.getItem('token');
    state.token = token;
    
    if (token) {
        try {
            const user = await getUser();
            state.currentUser = user;
        } catch (error) {
            localStorage.removeItem('token');
            state.token = null;
            state.currentUser = null;
        }
    }
    
    try {
        const [categories, tags] = await Promise.all([
            getCategories(),
            getTags()
        ]);
        state.categories = categories;
        state.tags = tags;
    } catch (error) {
        state.categories = [];
        state.tags = [];
    }
}