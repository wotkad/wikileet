import { getCategories, getTags, getUser } from './api.js';
import { updateUserSection } from './components/navbar.js';

let state = {
    currentUser: null,
    categories: [],
    tags: [],
};

const listeners = [];

export function getState() {
    return { ...state };
}

export function setState(newState) {
    const oldUser = state.currentUser;
    state = { ...state, ...newState };
    console.log('State updated:', state);
    
    // Если изменился пользователь, обновляем только секцию navbar
    if (oldUser !== state.currentUser) {
        updateUserSection();
    }
    
    listeners.forEach(listener => listener(state));
}

export function setAuth(user) {
    setState({ currentUser: user });
}

export function clearAuth() {
    setState({ currentUser: null });
}

export function subscribe(listener) {
    listeners.push(listener);
}

export async function initState() {
    try {
        const user = await getUser();
        state.currentUser = user;
        console.log('User loaded:', user);
    } catch (error) {
        console.log('No authenticated user');
        state.currentUser = null;
    }
    
    try {
        const [categories, tags] = await Promise.all([
            getCategories(),
            getTags()
        ]);
        state.categories = categories;
        state.tags = tags;
    } catch (error) {
        console.error('Error loading categories/tags:', error);
        state.categories = [];
        state.tags = [];
    }
    
    // Обновляем navbar после инициализации
    updateUserSection();
}