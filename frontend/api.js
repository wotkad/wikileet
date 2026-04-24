const API_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'API error');
    }

    return res.json();
}

/* AUTH */
export const register = (email, password) =>
    request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const login = (email, password) =>
    request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const getUser = () => request('/auth/me');

/* ARTICLES */
export const getArticles = (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/articles${q ? `?${q}` : ''}`);
};

export const getArticle = (slug) =>
    request(`/articles/by-slug/${slug}`);

/* CRUD */
export const createArticle = (data) =>
    request('/articles', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateArticle = (id, data) =>
    request(`/articles/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteArticle = (id) =>
    request(`/articles/delete/${id}`, {
        method: 'DELETE',
    });

/* META */
export const getCategories = () => request('/categories');
export const getTags = () => request('/tags');