import { getCategories, getTags, getUser } from './api.js';
import { clearFavoritesState } from './components/FavoriteButton.js';

let state = {
    currentUser: null,
    categories: [],
    tags: [],
};

const listeners = [];

async function updateUI() {
    try {
        const { updateHeaderUser } = await import('./components/Header.js');
        if (updateHeaderUser) updateHeaderUser();
        
        // Добавьте обновление сайдбара
        const { updateSidebar } = await import('./components/Sidebar.js');
        if (updateSidebar) updateSidebar();
    } catch (e) {
        // Игнорируем ошибки импорта
    }
}

export function getState() {
    return { ...state };
}

export function setState(newState) {
    state = { ...state, ...newState };
    console.log('State updated:', state);
    listeners.forEach(listener => listener(state));
    
    // Обновляем UI после изменения состояния
    updateUI();
}

export function setAuth(user) {
    console.log('Setting auth user:', user);
    setState({ currentUser: user });
}

export function clearAuth() {
    console.log('Clearing auth');
    setState({ currentUser: null });
    clearFavoritesState();
    updateUI();
}

export function subscribe(listener) {
    listeners.push(listener);
}

export async function initState() {
    console.log('Initializing state...');
    
    try {
        const user = await getUser();
        if (user && user._id) {
            state.currentUser = user;
            console.log('User loaded:', user);
        } else {
            state.currentUser = null;
            console.log('No authenticated user');
        }
    } catch (error) {
        console.log('Error loading user:', error);
        state.currentUser = null;
    }
    
    try {
        const [categories, tags] = await Promise.all([
            getCategories(),
            getTags()
        ]);
        state.categories = categories || [];
        state.tags = tags || [];
        console.log('Categories loaded:', categories.length);
        console.log('Tags loaded:', tags.length);
    } catch (error) {
        console.error('Error loading categories/tags:', error);
        state.categories = [];
        state.tags = [];
    }
}