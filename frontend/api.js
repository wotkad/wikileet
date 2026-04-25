const API_URL = '/api';

async function request(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

export async function register(name, email, password) {
    const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
    return data;
}

export async function login(email, password) {
    const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    return data;
}

export async function logout() {
    const data = await request('/auth/logout', {
        method: 'POST',
    });
    return data;
}

export async function getUser() {
    return request('/auth/me');
}

export async function getArticles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/articles${queryString ? `?${queryString}` : ''}`;
    const data = await request(url);
    
    if (data.articles) {
        return data;
    }
    return { articles: data || [], totalPages: 1, currentPage: 1, total: data?.length || 0 };
}

export async function getArticle(slug) {
    return request(`/articles/${slug}`);
}

export async function createArticle(article) {
    return request('/articles', {
        method: 'POST',
        body: JSON.stringify(article),
    });
}

export async function updateArticle(id, article) {
    return request(`/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(article),
    });
}

export async function deleteArticle(id) {
    return request(`/articles/${id}`, {
        method: 'DELETE',
    });
}

export async function getCategories() {
    const data = await request('/categories');
    return Array.isArray(data) ? data : [];
}

export async function getTags() {
    const data = await request('/tags');
    return Array.isArray(data) ? data : [];
}