const API_URL = '/api';

async function request(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        console.log(`Making request to: ${API_URL}${endpoint}`, { method: options.method || 'GET' });
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include', // Важно для отправки/получения cookie
        });

        console.log(`Response status for ${endpoint}:`, response.status);

        // Для 401 не выбрасываем ошибку, а возвращаем null
        if (response.status === 401) {
            console.log('Unauthorized request');
            return null;
        }

        if (response.status === 204) {
            return null;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'API request failed');
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        }
        
        return null;
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
    console.log('API login called for:', email);
    
    const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    
    console.log('API login response:', data);
    
    // Просто возвращаем данные, токен уже в cookie
    return data;
}

export async function logout() {
    const data = await request('/auth/logout', {
        method: 'POST',
    });
    return data;
}

export async function getUser() {
    const data = await request('/auth/me');
    return data;
}

export async function getArticles(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
    }
    if (params.categorySlug && params.categorySlug.trim()) {
        queryParams.append('categorySlug', params.categorySlug);
    }
    if (params.tagSlugs && params.tagSlugs.length > 0) {
        queryParams.append('tagSlugs', params.tagSlugs.join(','));
    }
    if (params.sort) {
        queryParams.append('sort', params.sort);
    }
    if (params.page) {
        queryParams.append('page', params.page);
    }
    if (params.limit) {
        queryParams.append('limit', params.limit);
    } else {
        queryParams.append('limit', '10');
    }
    if (params.status && params.status !== 'all') {
        queryParams.append('status', params.status);
    }
    if (params.author) {
        queryParams.append('author', params.author);
    }
    
    const queryString = queryParams.toString();
    const url = `/articles${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching articles with URL:', url);
    
    const data = await request(url);
    
    if (data && data.articles) {
        return data;
    }
    return { articles: data || [], totalPages: 1, currentPage: 1, total: data?.length || 0 };
}

export async function getArticle(slug) {
    const data = await request(`/articles/${slug}`);
    return data || { article: null, similar: [] };
}

export async function createArticle(articleData) {
    console.log('Creating article with data:', articleData);
    
    const data = await request('/articles', {
        method: 'POST',
        body: JSON.stringify(articleData),
    });
    
    console.log('Create article response:', data);
    return data;
}

export async function updateArticle(slug, articleData) {
    console.log('Updating article with slug:', slug, 'data:', articleData);
    
    const { article } = await getArticle(slug);
    if (!article) {
        throw new Error('Article not found');
    }
    
    console.log('Found article ID:', article._id);
    
    const data = await request(`/articles/${article._id}`, {
        method: 'PUT',
        body: JSON.stringify(articleData),
    });
    
    console.log('Update article response:', data);
    return data;
}

export async function deleteArticle(slug) {
    console.log('Deleting article with slug:', slug);
    
    const data = await request(`/articles/slug/${slug}`, {
        method: 'DELETE',
    });
    
    console.log('Delete response:', data);
    return data;
}

export async function getCategories() {
    const data = await request('/categories');
    return Array.isArray(data) ? data : [];
}

export async function getTags() {
    const data = await request('/tags');
    return Array.isArray(data) ? data : [];
}

export async function getUsers() {
    console.log('Fetching users list');
    const data = await request('/articles/users');
    console.log('Users data:', data);
    return Array.isArray(data) ? data : [];
}

export async function getUserArticles(userId) {
    if (!userId) {
        console.error('getUserArticles called without userId');
        return { articles: [], total: 0 };
    }
    
    console.log('Fetching articles for user ID:', userId);
    
    const data = await request(`/articles?author=${userId}&limit=50`);
    return data || { articles: [], total: 0 };
}