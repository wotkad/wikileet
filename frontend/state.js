// frontend/state.js

let state = {
    currentUser: null,
    token: localStorage.getItem('token'),
    categories: [],
    tags: [],
};

const listeners = [];

export function getState() {
    return state;
}

export function setState(newState) {
    state = { ...state, ...newState };
    listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
    listeners.push(fn);
}

/**
 * AUTH CONTROL
 */
export function setAuth(token, user = null) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }

    setState({
        token,
        currentUser: user
    });
}

export function clearAuth() {
    localStorage.removeItem('token');

    setState({
        token: null,
        currentUser: null
    });
}

/**
 * INIT STATE
 */
export async function initState() {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const { getUser } = await import('./api.js');
            const user = await getUser();

            setState({
                token,
                currentUser: user
            });
        } catch (err) {
            clearAuth();
        }
    }

    try {
        const { getCategories, getTags } = await import('./api.js');

        const [categories, tags] = await Promise.all([
            getCategories(),
            getTags()
        ]);

        setState({ categories, tags });
    } catch (err) {
        console.error('Failed to load initial data', err);
    }
}