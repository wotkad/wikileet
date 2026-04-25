import { getArticles, getArticle, getCategories, getTags } from '../api.js';
import ArticleCard from './ArticleCard.js';
import { updateSidebar } from './Sidebar.js';
import { updateHeaderUser } from './Header.js';

let currentFilters = {
    search: '',
    category: '',
    tags: [],
    sort: '-createdAt',
    page: 1
};

export default function ContentArea() {
    return `
        <main class="flex-1">
            <div class="main-content-area p-6" id="main-content">
                <div class="loading-skeleton space-y-4">
                    <div class="skeleton h-8 w-64 rounded"></div>
                    <div class="skeleton h-32 w-full rounded"></div>
                    <div class="skeleton h-32 w-full rounded"></div>
                </div>
            </div>
        </main>
    `;
}

export async function loadContent(view, params = {}) {
    const contentDiv = document.getElementById('main-content');
    if (!contentDiv) return;
    
    try {
        let html = '';
        
        if (view === 'home') {
            html = await renderHome();
        } else if (view === 'wiki') {
            html = await renderWiki(params);
        } else if (view === 'article') {
            html = await renderArticle(params.slug);
        } else if (view === 'login') {
            html = renderLogin();
        } else if (view === 'register') {
            html = renderRegister();
        } else {
            html = await renderHome();
        }
        
        contentDiv.innerHTML = html;
        attachContentEvents();
    } catch (error) {
        console.error('Error loading content:', error);
        contentDiv.innerHTML = '<div class="text-center text-red-400">Error loading content</div>';
    }
}

async function renderHome() {
    const [categories, tags, recentArticles, popularArticles] = await Promise.all([
        getCategories(),
        getTags(),
        getArticles({ sort: '-createdAt', limit: 6 }),
        getArticles({ sort: '-views', limit: 6 })
    ]);
    
    updateSidebar();
    
    return `
        <div class="max-w-6xl mx-auto space-y-8">
            <div class="text-center space-y-4">
                <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Knowledge Base Platform
                </h1>
                <p class="text-gray-300 max-w-2xl mx-auto">
                    Your comprehensive knowledge base for organized information, easy access, and collaborative learning.
                </p>
            </div>
            
            <div>
                <h2 class="text-2xl font-bold mb-4">🆕 Recent Articles</h2>
                <div class="grid md:grid-cols-2 gap-4">
                    ${recentArticles.articles?.map(article => ArticleCard(article)).join('') || '<div class="text-gray-400">No articles yet</div>'}
                </div>
            </div>
            
            <div>
                <h2 class="text-2xl font-bold mb-4">🔥 Popular Articles</h2>
                <div class="grid md:grid-cols-2 gap-4">
                    ${popularArticles.articles?.map(article => ArticleCard(article)).join('') || '<div class="text-gray-400">No articles yet</div>'}
                </div>
            </div>
        </div>
    `;
}

async function renderWiki(filters = {}) {
    Object.assign(currentFilters, filters);
    const data = await getArticles(currentFilters);
    
    return `
        <div class="max-w-4xl mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-bold mb-2">All Articles</h1>
                <p class="text-gray-400">${data.total || 0} articles found</p>
            </div>
            
            <div class="mb-6">
                <input type="text" 
                       id="searchInput" 
                       placeholder="Search articles..." 
                       class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       value="${currentFilters.search || ''}">
            </div>
            
            <div class="space-y-4" id="articles-list">
                ${data.articles?.map(article => ArticleCard(article)).join('') || '<div class="text-gray-400 text-center py-8">No articles found</div>'}
            </div>
            
            ${data.totalPages > 1 ? renderPagination(data) : ''}
        </div>
    `;
}

async function renderArticle(slug) {
    try {
        const data = await getArticle(slug);
        const article = data.article;
        const similar = data.similar || [];
        
        return `
            <article class="max-w-4xl mx-auto">
                <button data-view="wiki" class="mb-4 text-blue-400 hover:text-blue-300 transition flex items-center space-x-1">
                    <span>←</span>
                    <span>Back to articles</span>
                </button>
                
                <div class="bg-gray-800 rounded-lg p-8">
                    <h1 class="text-4xl font-bold mb-4">${article.title}</h1>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm">
                            ${article.category?.name || 'Uncategorized'}
                        </span>
                        ${article.tags?.map(tag => `
                            <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                                ${tag.name}
                            </span>
                        `).join('') || ''}
                    </div>
                    
                    <div class="text-sm text-gray-400 mb-6 space-y-1">
                        <div>📅 ${new Date(article.createdAt).toLocaleDateString()}</div>
                        <div>👁️ ${article.views} views</div>
                        <div>✍️ By ${article.author?.name || article.author?.email || 'Unknown'}</div>
                    </div>
                    
                    <div class="prose max-w-none">
                        ${article.content}
                    </div>
                </div>
                
                ${similar.length > 0 ? `
                    <div class="mt-8 bg-gray-800 rounded-lg p-6">
                        <h3 class="text-xl font-bold mb-4">Similar Articles</h3>
                        <div class="space-y-3">
                            ${similar.map(art => `
                                <div class="cursor-pointer hover:bg-gray-700 p-3 rounded transition" data-article="${art.slug}">
                                    <h4 class="font-semibold">${art.title}</h4>
                                    <p class="text-sm text-gray-400">${art.category?.name || 'Uncategorized'}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </article>
        `;
    } catch (error) {
        return `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-red-400">Article not found</h2>
                <button data-view="wiki" class="mt-4 px-4 py-2 bg-blue-600 rounded-lg">Back to Wiki</button>
            </div>
        `;
    }
}

function renderLogin() {
    return `
        <div class="max-w-md mx-auto mt-20">
            <div class="bg-gray-800 rounded-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
                
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" id="email" required class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Password</label>
                        <input type="password" id="password" required class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div id="errorMsg" class="text-red-400 text-sm hidden"></div>
                    
                    <button type="submit" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                        Login
                    </button>
                </form>
            </div>
        </div>
    `;
}

function renderRegister() {
    return `
        <div class="max-w-md mx-auto mt-20">
            <div class="bg-gray-800 rounded-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>
                
                <form id="registerForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Name</label>
                        <input type="text" id="name" required class="w-full px-3 py-2 bg-gray-700 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" id="email" required class="w-full px-3 py-2 bg-gray-700 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Password</label>
                        <input type="password" id="password" required class="w-full px-3 py-2 bg-gray-700 rounded-lg">
                    </div>
                    <div id="errorMsg" class="text-red-400 text-sm hidden"></div>
                    <button type="submit" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Register</button>
                </form>
            </div>
        </div>
    `;
}

function renderPagination(data) {
    return `
        <div class="flex justify-center gap-2 mt-8">
            ${Array.from({ length: data.totalPages }, (_, i) => i + 1).map(page => `
                <button class="page-btn px-3 py-1 rounded ${page === currentFilters.page ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}"
                        data-page="${page}">
                    ${page}
                </button>
            `).join('')}
        </div>
    `;
}

function attachContentEvents() {
    // Handle view navigation
    document.querySelectorAll('[data-view]').forEach(el => {
        el.onclick = (e) => {
            e.preventDefault();
            const view = el.getAttribute('data-view');
            if (view === 'login' || view === 'register' || view === 'home' || view === 'wiki') {
                loadContent(view);
            }
        };
    });
    
    // Handle article clicks
    document.querySelectorAll('[data-article]').forEach(el => {
        el.onclick = () => {
            const slug = el.getAttribute('data-article');
            loadContent('article', { slug });
        };
    });
    
    // Handle category filter
    document.querySelectorAll('[data-category]').forEach(el => {
        el.onclick = () => {
            const category = el.getAttribute('data-category');
            loadContent('wiki', { category });
        };
    });
    
    // Handle tag filter
    document.querySelectorAll('[data-tag]').forEach(el => {
        el.onclick = () => {
            const tag = el.getAttribute('data-tag');
            loadContent('wiki', { tags: [tag] });
        };
    });
    
    // Handle search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadContent('wiki', { search: searchInput.value });
            }, 500);
        };
    }
    
    // Handle pagination
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.onclick = () => {
            const page = parseInt(btn.getAttribute('data-page'));
            loadContent('wiki', { ...currentFilters, page });
        };
    });
    
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMsg');
            
            if (!email || !password) {
                if (errorMsg) {
                    errorMsg.textContent = 'Please fill in all fields';
                    errorMsg.classList.remove('hidden');
                }
                return;
            }
            
            try {
                console.log('Attempting login for:', email);
                const authModule = await import('../auth.js');
                await authModule.login(email, password);
                console.log('Login successful');
                updateHeaderUser();
                loadContent('home');
            } catch (error) {
                console.error('Login error:', error);
                if (errorMsg) {
                    errorMsg.textContent = error.message || 'Invalid credentials';
                    errorMsg.classList.remove('hidden');
                }
            }
        };
    }
    
    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMsg');
            
            if (!name || !email || !password) {
                if (errorMsg) {
                    errorMsg.textContent = 'Please fill in all fields';
                    errorMsg.classList.remove('hidden');
                }
                return;
            }
            
            if (password.length < 6) {
                if (errorMsg) {
                    errorMsg.textContent = 'Password must be at least 6 characters';
                    errorMsg.classList.remove('hidden');
                }
                return;
            }
            
            try {
                console.log('Attempting registration for:', email);
                const authModule = await import('../auth.js');
                await authModule.register(name, email, password);
                console.log('Registration successful');
                updateHeaderUser();
                loadContent('home');
            } catch (error) {
                console.error('Registration error:', error);
                if (errorMsg) {
                    errorMsg.textContent = error.message || 'Registration failed';
                    errorMsg.classList.remove('hidden');
                }
            }
        };
    }
}