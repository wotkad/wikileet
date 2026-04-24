import { getState } from '../state.js';
import { getArticles } from '../api.js';
import router from '../router.js';
import ArticleCard from '../components/articleCard.js';

let currentFilters = {
    search: '',
    category: '',
    tags: [],
    sort: '-createdAt',
    page: 1,
};

export default async function WikiPage() {
    const state = getState();
    const urlParams = new URLSearchParams(window.location.search);
    
    currentFilters = {
        search: urlParams.get('search') || '',
        category: urlParams.get('category') || '',
        tags: urlParams.get('tags') ? urlParams.get('tags').split(',') : [],
        sort: urlParams.get('sort') || '-createdAt',
        page: parseInt(urlParams.get('page')) || 1,
    };

    const data = await getArticles(currentFilters);

    return `
        <div class="flex gap-8">
            <div class="w-80 space-y-6">
                <div class="bg-gray-800 rounded-lg p-4">
                    <h3 class="font-semibold mb-3">Search</h3>
                    <input type="text" 
                           id="searchInput" 
                           placeholder="Search articles..." 
                           class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           value="${currentFilters.search}">
                </div>

                <div class="bg-gray-800 rounded-lg p-4">
                    <h3 class="font-semibold mb-3">Category</h3>
                    <select id="categorySelect" class="w-full px-3 py-2 bg-gray-700 rounded-lg">
                        <option value="">All Categories</option>
                        ${state.categories.map(cat => `
                            <option value="${cat._id}" ${currentFilters.category === cat._id ? 'selected' : ''}>
                                ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="bg-gray-800 rounded-lg p-4">
                    <h3 class="font-semibold mb-3">Tags</h3>
                    <div class="space-y-2">
                        ${state.tags.map(tag => `
                            <label class="flex items-center gap-2">
                                <input type="checkbox" 
                                       value="${tag._id}"
                                       ${currentFilters.tags.includes(tag._id) ? 'checked' : ''}
                                       class="tag-checkbox">
                                <span class="text-sm">${tag.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-gray-800 rounded-lg p-4">
                    <h3 class="font-semibold mb-3">Sort by</h3>
                    <select id="sortSelect" class="w-full px-3 py-2 bg-gray-700 rounded-lg">
                        <option value="-createdAt" ${currentFilters.sort === '-createdAt' ? 'selected' : ''}>Newest</option>
                        <option value="createdAt" ${currentFilters.sort === 'createdAt' ? 'selected' : ''}>Oldest</option>
                        <option value="-views" ${currentFilters.sort === '-views' ? 'selected' : ''}>Most Viewed</option>
                    </select>
                </div>

                <button id="applyFilters" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                    Apply Filters
                </button>
            </div>

            <div class="flex-1">
                <div class="mb-6">
                    <h1 class="text-3xl font-bold">Knowledge Base</h1>
                    <p class="text-gray-400 mt-1">${data.total} articles found</p>
                </div>

                <div class="space-y-4">
                    ${data.articles.length > 0 
                        ? data.articles.map(article => ArticleCard(article)).join('')
                        : '<div class="text-center py-12 text-gray-400">No articles found</div>'
                    }
                </div>

                ${data.totalPages > 1 ? `
                    <div class="flex justify-center gap-2 mt-8">
                        ${Array.from({ length: data.totalPages }, (_, i) => i + 1).map(page => `
                            <button class="page-btn px-3 py-1 rounded ${page === currentFilters.page ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}"
                                    data-page="${page}">
                                ${page}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

setTimeout(() => {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const sortSelect = document.getElementById('sortSelect');
    const applyBtn = document.getElementById('applyFilters');
    const tagCheckboxes = document.querySelectorAll('.tag-checkbox');
    const pageBtns = document.querySelectorAll('.page-btn');

    const applyFilters = () => {
        const tags = Array.from(tagCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        const params = new URLSearchParams();
        if (searchInput.value) params.set('search', searchInput.value);
        if (categorySelect.value) params.set('category', categorySelect.value);
        if (tags.length) params.set('tags', tags.join(','));
        if (sortSelect.value) params.set('sort', sortSelect.value);
        params.set('page', '1');
        
        router.navigate(`/wiki?${params.toString()}`);
    };

    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 500);
        });
    }
    
    pageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', btn.dataset.page);
            router.navigate(`/wiki?${params.toString()}`);
        });
    });
}, 100);