import { getArticles, getCategories, getTags } from '../api.js';
import ArticleCard from '../components/ArticleCard.js';

let currentFilters = {
    search: '',
    category: '',
    tags: [],
    sort: '-createdAt',
    page: 1,
};

export default async function WikiPage() {
    const urlParams = new URLSearchParams(window.location.search);
    
    currentFilters = {
        search: urlParams.get('search') || '',
        category: urlParams.get('category') || '',
        tags: urlParams.get('tags') ? urlParams.get('tags').split(',') : [],
        sort: urlParams.get('sort') || '-createdAt',
        page: parseInt(urlParams.get('page')) || 1,
    };

    const data = await getArticles(currentFilters);
    const categories = await getCategories();
    const tags = await getTags();

    return `
        <div class="mx-auto">
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
            
            <div class="grid grid-cols-1 gap-4" id="articles-list">
                ${data.articles?.map(article => ArticleCard(article)).join('') || '<div class="text-gray-400 text-center py-8">No articles found</div>'}
            </div>
            
            ${data.totalPages > 1 ? renderPagination(data) : ''}
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

// Привязываем события после рендера
setTimeout(() => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                params.set('search', searchInput.value);
                params.set('page', '1');
                window.router.navigate(`/wiki?${params.toString()}`);
            }, 500);
        });
    }
    
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', btn.dataset.page);
            window.router.navigate(`/wiki?${params.toString()}`);
        });
    });
}, 100);