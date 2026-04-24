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

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

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

export const getArticles = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/articles${query ? `?${query}` : ''}`);
};

export const getArticle = (slug) =>
    request(`/articles/article/${slug}`);

export const createArticle = (article) =>
    request('/articles', {
        method: 'POST',
        body: JSON.stringify(article),
    });

export const updateArticle = (id, article) =>
    request(`/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(article),
    });

export const deleteArticle = (id) =>
    request(`/articles/${id}`, {
        method: 'DELETE',
    });

export const getCategories = () => request('/categories');
export const getTags = () => request('/tags');