import { getCategories, getTags, getUser } from './api.js';

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
    state = { ...state, ...newState };
    console.log('State updated:', state);
    listeners.forEach(listener => listener(state));
}

export function setAuth(user) {
    console.log('Setting auth user:', user);
    setState({ currentUser: user });
}

export function clearAuth() {
    console.log('Clearing auth');
    setState({ currentUser: null });
}

export function subscribe(listener) {
    listeners.push(listener);
}

export async function initState() {
    console.log('Initializing state...');
    
    try {
        const user = await getUser();
        state.currentUser = user;
        console.log('User loaded:', user);
    } catch (error) {
        console.log('No authenticated user:', error.message);
        state.currentUser = null;
    }
    
    try {
        const [categories, tags] = await Promise.all([
            getCategories(),
            getTags()
        ]);
        state.categories = categories;
        state.tags = tags;
        console.log('Categories loaded:', categories.length);
        console.log('Tags loaded:', tags.length);
    } catch (error) {
        console.error('Error loading categories/tags:', error);
        state.categories = [];
        state.tags = [];
    }
}