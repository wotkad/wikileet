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
 * AUTH STATE (ЕДИНСТВЕННЫЙ МЕХАНИЗМ)
 */
export function setAuth(token, user = null) {
    state = {
        ...state,
        token,
        currentUser: user,
    };

    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }

    listeners.forEach(fn => fn(state));
}

export function clearAuth() {
    setAuth(null, null);
}

export async function initState() {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const { getUser } = await import('./api.js');
            const user = await getUser();

            setAuth(token, user);
        } catch (err) {
            console.warn('Auth expired');
            setAuth(null, null);
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
        console.error(err);
    }
}