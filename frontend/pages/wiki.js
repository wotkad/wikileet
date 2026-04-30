import { PAGINATION, SEARCH } from '../constants.js';
import { escapeHtml, debounce } from '../utils/utils.js';
import { getArticles, getCategories, getTags } from '../api.js';
import ArticleCard from '../components/ArticleCard.js';
import { renderPagination, attachPaginationEvents } from '../components/Pagination.js';

let currentFilters = {
    search: '',
    categorySlug: '',
    tagSlugs: [],
    sort: '-createdAt',
    page: 1,
    limit: PAGINATION.WIKI_LIMIT
};

let selectedTagSlugs = new Set();

// Функция для обновления только контента (статьи, пагинация, счетчик)
async function updateWikiContent() {
    const [data, tags] = await Promise.all([
        getArticles(currentFilters),
        getTags()
    ]);
    
    // Обновляем счетчик найденных записей
    const countElement = document.querySelector('.articles-count');
    if (countElement) {
        countElement.textContent = `${data.total || 0} записей найдено`;
    }
    
    // Обновляем список статей
    const articlesList = document.getElementById('articles-list');
    if (articlesList) {
        articlesList.innerHTML = data.articles && data.articles.length > 0 ? 
            data.articles.map(article => ArticleCard(article)).join('') : 
            '<div class="text-gray-400 text-center py-8">Записей не найдено</div>';
    }
    
    // Обновляем пагинацию
    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
        const newPagination = renderPagination(currentFilters.page, data.totalPages);
        if (newPagination) {
            paginationContainer.innerHTML = newPagination;
            attachPaginationEvents(onPageChange);
        } else if (paginationContainer.parentNode) {
            paginationContainer.innerHTML = '';
        }
    }
}

const performSearch = debounce(async (searchValue) => {
    // Обновляем фильтры
    currentFilters.search = searchValue;
    currentFilters.page = 1;
    
    // Обновляем URL без перезагрузки страницы
    const url = new URL(window.location.href);
    if (searchValue && searchValue.trim()) {
        url.searchParams.set('search', searchValue.trim());
    } else {
        url.searchParams.delete('search');
    }
    url.searchParams.delete('page');
    window.history.pushState({}, '', url);
    
    // Обновляем контент
    await updateWikiContent();
}, SEARCH.DEBOUNCE_DELAY);

function onPageChange(page) {
    currentFilters.page = page;
    
    // Обновляем URL
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
    
    // Обновляем контент
    updateWikiContent();
}

function applyTagFilters() {
    const params = new URLSearchParams(window.location.search);
    const tagsArray = Array.from(selectedTagSlugs);
    if (tagsArray.length > 0) {
        params.set('tags', tagsArray.join(','));
    } else {
        params.delete('tags');
    }
    params.set('page', '1');
    window.router.navigate(`/wiki?${params.toString()}`);
}

export default async function WikiPage() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const tagsFromUrl = urlParams.get('tags') ? urlParams.get('tags').split(',') : [];
    selectedTagSlugs = new Set(tagsFromUrl);
    
    currentFilters = {
        search: urlParams.get('search') || '',
        categorySlug: urlParams.get('category') || '',
        tagSlugs: tagsFromUrl,
        sort: urlParams.get('sort') || '-createdAt',
        page: parseInt(urlParams.get('page')) || 1,
        limit: PAGINATION.WIKI_LIMIT
    };
    
    const [data, categories, tags] = await Promise.all([
        getArticles(currentFilters),
        getCategories(),
        getTags()
    ]);
    
    const categoryMap = new Map(categories.map(c => [c.slug, c]));
    const tagMap = new Map(tags.map(t => [t.slug, t]));
    
    let selectedCategoryName = '';
    if (currentFilters.categorySlug) {
        const selectedCat = categoryMap.get(currentFilters.categorySlug);
        selectedCategoryName = selectedCat ? selectedCat.name : '';
    }

    return `
        <div class="mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-bold mb-2">Все записи</h1>
                ${renderFiltersInfo(selectedCategoryName, currentFilters.tagSlugs, tagMap)}
                <p class="text-gray-400 mt-2 articles-count">${data.total || 0} записей найдено</p>
            </div>
            
            <div class="mb-6">
                <input type="text" 
                       id="searchInput" 
                       placeholder="Введите название или описание" 
                       autocomplete="off"
                       class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       value="${escapeHtml(currentFilters.search)}">
            </div>
            
            <div class="mb-6 bg-gray-800 rounded-lg p-4">
                <h3 class="text-sm font-semibold mb-2 text-gray-300">Фильтр по тегам:</h3>
                <div class="flex flex-wrap gap-2" id="tags-filter">
                    ${tags.map(tag => `
                        <button data-tag="${tag.slug}" 
                                class="tag-filter-btn px-3 py-1 rounded-full text-sm transition ${currentFilters.tagSlugs.includes(tag.slug) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">
                            ${escapeHtml(tag.name)}
                        </button>
                    `).join('')}
                </div>
                ${currentFilters.tagSlugs.length > 0 ? `
                    <button id="clearTagsBtn" class="mt-3 text-xs text-red-400 hover:text-red-300 transition">
                        Очистить все теги
                    </button>
                ` : ''}
            </div>
            
            ${(currentFilters.categorySlug || currentFilters.tagSlugs.length > 0) ? renderClearFilters() : ''}
            
            <div class="grid grid-cols-1 gap-4" id="articles-list">
                ${data.articles && data.articles.length > 0 ? 
                    data.articles.map(article => ArticleCard(article)).join('') : 
                    '<div class="text-gray-400 text-center py-8">Записей не найдено</div>'}
            </div>
            
            <div class="pagination-container">
                ${renderPagination(currentFilters.page, data.totalPages)}
            </div>
        </div>
    `;
}

function renderFiltersInfo(categoryName, selectedTagSlugs, tagMap) {
    const filters = [];
    
    if (categoryName) {
        filters.push(`<span class="px-2 py-1 bg-blue-900 text-blue-300 rounded">Категория: ${categoryName}</span>`);
    }
    
    if (selectedTagSlugs && selectedTagSlugs.length > 0) {
        const selectedTagNames = selectedTagSlugs
            .map(slug => tagMap.get(slug)?.name)
            .filter(Boolean);
        filters.push(`<span class="px-2 py-1 bg-green-900 text-green-300 rounded">Теги: ${selectedTagNames.join(', ')}</span>`);
    }
    
    if (filters.length === 0) return '';
    
    return `
        <div class="flex flex-wrap gap-2 mt-2 mb-2">
            ${filters.join('')}
        </div>
    `;
}

function renderClearFilters() {
    return `
        <div class="mb-4">
            <button id="clearFiltersBtn" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
                ✕ Очистить все фильтры
            </button>
        </div>
    `;
}

function updateTagFilters() {
    const tagButtons = document.querySelectorAll('.tag-filter-btn');
    tagButtons.forEach(btn => {
        const tagSlug = btn.dataset.tag;
        if (selectedTagSlugs.has(tagSlug)) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-gray-700', 'text-gray-300');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-300');
        }
    });
}

window.initWikiEvents = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const currentValue = searchInput.value;
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.value = currentValue;
        
        newSearchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
        
        newSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(e.target.value);
            }
        });
        
        // Восстанавливаем фокус только при инициализации
        // newSearchInput.focus();
        const len = newSearchInput.value.length;
        newSearchInput.setSelectionRange(len, len);
    }
    
    const tagsContainer = document.getElementById('tags-filter');
    if (tagsContainer) {
        const tagButtons = tagsContainer.querySelectorAll('.tag-filter-btn');
        tagButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                const tagSlug = newBtn.dataset.tag;
                if (selectedTagSlugs.has(tagSlug)) {
                    selectedTagSlugs.delete(tagSlug);
                } else {
                    selectedTagSlugs.add(tagSlug);
                }
                updateTagFilters();
                applyTagFilters();
            });
        });
    }
    
    const clearTagsBtn = document.getElementById('clearTagsBtn');
    if (clearTagsBtn) {
        const newClearTagsBtn = clearTagsBtn.cloneNode(true);
        clearTagsBtn.parentNode.replaceChild(newClearTagsBtn, clearTagsBtn);
        
        newClearTagsBtn.addEventListener('click', () => {
            selectedTagSlugs.clear();
            updateTagFilters();
            applyTagFilters();
        });
    }
    
    attachPaginationEvents(onPageChange);
    
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        
        newClearBtn.addEventListener('click', () => {
            selectedTagSlugs.clear();
            window.router.navigate('/wiki');
        });
    }
};