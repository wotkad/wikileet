import { PAGINATION, SEARCH } from '../constants.js';
import { escapeHtml, debounce } from '../utils/utils.js';
import { getArticles, getCategories, getTags, getUsers } from '../api.js';
import ArticleCard from '../components/ArticleCard.js';
import { renderPagination, attachPaginationEvents } from '../components/Pagination.js';
import { renderSearchInput, initSearchInput } from '../components/Search.js';

let currentFilters = {
    search: '',
    categorySlug: '',
    tagSlugs: [],
    sort: '-createdAt',
    page: 1,
    limit: PAGINATION.WIKI_LIMIT,
    dateFrom: '',
    dateTo: '',
    author: ''
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

// Функция для полного обновления страницы (сохраняет состояние)
async function refreshWikiPage() {
    const [data, categories, tags, users] = await Promise.all([
        getArticles(currentFilters),
        getCategories(),
        getTags(),
        getUsers()
    ]);
    
    const categoryMap = new Map(categories.map(c => [c.slug, c]));
    const tagMap = new Map(tags.map(t => [t.slug, t]));
    
    let selectedCategoryName = '';
    if (currentFilters.categorySlug) {
        const selectedCat = categoryMap.get(currentFilters.categorySlug);
        selectedCategoryName = selectedCat ? selectedCat.name : '';
    }
    
    const selectedAuthor = users.find(u => u._id === currentFilters.author);
    const selectedAuthorName = selectedAuthor ? selectedAuthor.name : '';
    const hasDateFilter = currentFilters.dateFrom || currentFilters.dateTo;
    
    // Обновляем весь блок фильтров
    const filtersContainer = document.querySelector('.filters-container');
    if (filtersContainer) {
        filtersContainer.innerHTML = renderFiltersBlock(tags, selectedCategoryName, currentFilters.tagSlugs, tagMap, selectedAuthorName, currentFilters.dateFrom, currentFilters.dateTo, hasDateFilter);
    }
    
    // Обновляем счетчик
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
    
    // Перепривязываем события
    attachFilterEvents(tags);
}

function renderFiltersBlock(tags, categoryName, selectedTagSlugsList, tagMap, authorName, dateFrom, dateTo, hasDateFilter) {
    return `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-sm font-semibold mb-2 text-gray-300">Фильтр по тегам:</h3>
                <div class="flex flex-wrap gap-2" id="tags-filter">
                    ${tags.map(tag => `
                        <button data-tag="${tag.slug}" 
                                class="tag-filter-btn px-3 py-1 rounded-full text-sm transition ${selectedTagSlugsList.includes(tag.slug) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">
                            ${escapeHtml(tag.name)}
                        </button>
                    `).join('')}
                </div>
                ${selectedTagSlugsList.length > 0 ? `
                    <button id="clearTagsBtn" class="mt-3 text-xs text-red-400 hover:text-red-300 transition">
                        Очистить все теги
                    </button>
                ` : ''}
            </div>
            
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-sm font-semibold mb-2 text-gray-300">Сортировка:</h3>
                <select id="sortSelect" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="-createdAt" ${currentFilters.sort === '-createdAt' ? 'selected' : ''}>📅 Самые новые</option>
                    <option value="createdAt" ${currentFilters.sort === 'createdAt' ? 'selected' : ''}>📅 Самые старые</option>
                    <option value="title" ${currentFilters.sort === 'title' ? 'selected' : ''}>🔤 От А до Я</option>
                    <option value="-title" ${currentFilters.sort === '-title' ? 'selected' : ''}>🔤 От Я до А</option>
                    <option value="-views" ${currentFilters.sort === '-views' ? 'selected' : ''}>👁️ По популярности</option>
                </select>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-sm font-semibold mb-2 text-gray-300">Фильтр по дате:</h3>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">От:</label>
                        <input type="date" 
                               id="dateFrom" 
                               value="${dateFrom}"
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-400 mb-1">До:</label>
                        <input type="date" 
                               id="dateTo" 
                               value="${dateTo}"
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    </div>
                </div>
                ${hasDateFilter ? `
                    <button id="clearDateBtn" class="mt-2 text-xs text-red-400 hover:text-red-300 transition">
                        Очистить даты
                    </button>
                ` : ''}
            </div>
            
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-sm font-semibold mb-2 text-gray-300">Фильтр по автору:</h3>
                <select id="authorSelect" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Все авторы</option>
                    ${tags.map(user => `
                        <option value="${user._id}" ${currentFilters.author === user._id ? 'selected' : ''}>
                            ${escapeHtml(user.name)} (${user.articlesCount || 0} записей)
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
        
        ${(currentFilters.categorySlug || currentFilters.tagSlugs.length > 0 || currentFilters.dateFrom || currentFilters.dateTo || currentFilters.author) ? `
            <div class="mb-4">
                <button id="clearFiltersBtn" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
                    ✕ Очистить все фильтры
                </button>
            </div>
        ` : ''}
        
        <div class="flex flex-wrap gap-2 mt-2 mb-2" id="filters-info">
            ${renderFiltersInfo(categoryName, currentFilters.tagSlugs, tagMap, authorName, dateFrom, dateTo)}
        </div>
    `;
}

const performSearch = debounce(async (searchValue) => {
    currentFilters.search = searchValue;
    currentFilters.page = 1;
    
    const url = new URL(window.location.href);
    if (searchValue && searchValue.trim()) {
        url.searchParams.set('search', searchValue.trim());
    } else {
        url.searchParams.delete('search');
    }
    url.searchParams.delete('page');
    window.history.pushState({}, '', url);
    
    await updateWikiContent();
}, SEARCH.DEBOUNCE_DELAY);

function onPageChange(page) {
    currentFilters.page = page;
    
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
    
    updateWikiContent();
}

function onSortChange(sortValue) {
    currentFilters.sort = sortValue;
    currentFilters.page = 1;
    
    const url = new URL(window.location.href);
    url.searchParams.set('sort', sortValue);
    url.searchParams.delete('page');
    window.history.pushState({}, '', url);
    
    refreshWikiPage();
}

function onDateFilterChange() {
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    
    currentFilters.dateFrom = dateFrom;
    currentFilters.dateTo = dateTo;
    currentFilters.page = 1;
    
    const url = new URL(window.location.href);
    if (dateFrom) {
        url.searchParams.set('dateFrom', dateFrom);
    } else {
        url.searchParams.delete('dateFrom');
    }
    if (dateTo) {
        url.searchParams.set('dateTo', dateTo);
    } else {
        url.searchParams.delete('dateTo');
    }
    url.searchParams.delete('page');
    window.history.pushState({}, '', url);
    
    refreshWikiPage();
}

function onAuthorFilterChange(authorId) {
    currentFilters.author = authorId;
    currentFilters.page = 1;
    
    const url = new URL(window.location.href);
    if (authorId) {
        url.searchParams.set('author', authorId);
    } else {
        url.searchParams.delete('author');
    }
    url.searchParams.delete('page');
    window.history.pushState({}, '', url);
    
    refreshWikiPage();
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

function attachFilterEvents(tags) {
    // Сортировка
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        const newSortSelect = sortSelect.cloneNode(true);
        sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
        newSortSelect.addEventListener('change', (e) => {
            onSortChange(e.target.value);
        });
    }
    
    // Фильтр по дате
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom) {
        const newDateFrom = dateFrom.cloneNode(true);
        dateFrom.parentNode.replaceChild(newDateFrom, dateFrom);
        newDateFrom.addEventListener('change', () => {
            onDateFilterChange();
        });
    }
    if (dateTo) {
        const newDateTo = dateTo.cloneNode(true);
        dateTo.parentNode.replaceChild(newDateTo, dateTo);
        newDateTo.addEventListener('change', () => {
            onDateFilterChange();
        });
    }
    
    // Кнопка очистки дат
    const clearDateBtn = document.getElementById('clearDateBtn');
    if (clearDateBtn) {
        const newClearDateBtn = clearDateBtn.cloneNode(true);
        clearDateBtn.parentNode.replaceChild(newClearDateBtn, clearDateBtn);
        newClearDateBtn.addEventListener('click', () => {
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');
            if (dateFromInput) dateFromInput.value = '';
            if (dateToInput) dateToInput.value = '';
            onDateFilterChange();
        });
    }
    
    // Фильтр по автору
    const authorSelect = document.getElementById('authorSelect');
    if (authorSelect) {
        const newAuthorSelect = authorSelect.cloneNode(true);
        authorSelect.parentNode.replaceChild(newAuthorSelect, authorSelect);
        newAuthorSelect.addEventListener('change', (e) => {
            onAuthorFilterChange(e.target.value);
        });
    }
    
    // Теги
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
    
    // Кнопка очистки тегов
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
    
    // Кнопка очистки всех фильтров
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        newClearBtn.addEventListener('click', () => {
            selectedTagSlugs.clear();
            window.router.navigate('/wiki');
        });
    }
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
        limit: PAGINATION.WIKI_LIMIT,
        dateFrom: urlParams.get('dateFrom') || '',
        dateTo: urlParams.get('dateTo') || '',
        author: urlParams.get('author') || ''
    };
    
    const [data, categories, tags, users] = await Promise.all([
        getArticles(currentFilters),
        getCategories(),
        getTags(),
        getUsers()
    ]);
    
    const categoryMap = new Map(categories.map(c => [c.slug, c]));
    const tagMap = new Map(tags.map(t => [t.slug, t]));
    
    let selectedCategoryName = '';
    if (currentFilters.categorySlug) {
        const selectedCat = categoryMap.get(currentFilters.categorySlug);
        selectedCategoryName = selectedCat ? selectedCat.name : '';
    }
    
    const selectedAuthor = users.find(u => u._id === currentFilters.author);
    const selectedAuthorName = selectedAuthor ? selectedAuthor.name : '';
    const hasDateFilter = currentFilters.dateFrom || currentFilters.dateTo;

    return `
        <div class="mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-bold mb-2">Все записи</h1>
                <div class="filters-container">
                    ${renderFiltersBlock(tags, selectedCategoryName, currentFilters.tagSlugs, tagMap, selectedAuthorName, currentFilters.dateFrom, currentFilters.dateTo, hasDateFilter)}
                </div>
                <p class="text-gray-400 mt-2 articles-count">${data.total || 0} записей найдено</p>
            </div>
            
            <div class="mb-6">
                ${renderSearchInput({
                    id: 'searchInput',
                    placeholder: 'Введите название или описание',
                    initialValue: currentFilters.search
                })}
            </div>
            
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

function renderFiltersInfo(categoryName, selectedTagSlugs, tagMap, authorName, dateFrom, dateTo) {
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
    
    if (authorName) {
        filters.push(`<span class="px-2 py-1 bg-purple-900 text-purple-300 rounded">Автор: ${authorName}</span>`);
    }
    
    if (dateFrom || dateTo) {
        let dateText = '';
        if (dateFrom && dateTo) {
            dateText = `${dateFrom} — ${dateTo}`;
        } else if (dateFrom) {
            dateText = `с ${dateFrom}`;
        } else if (dateTo) {
            dateText = `по ${dateTo}`;
        }
        filters.push(`<span class="px-2 py-1 bg-yellow-900 text-yellow-300 rounded">📅 ${dateText}</span>`);
    }
    
    if (filters.length === 0) return '';
    
    return filters.join('');
}

window.initWikiEvents = function() {
    // Инициализация поиска
    initSearchInput({
        id: 'searchInput',
        onSearch: (searchValue) => {
            currentFilters.search = searchValue;
            currentFilters.page = 1;
            
            const url = new URL(window.location.href);
            if (searchValue && searchValue.trim()) {
                url.searchParams.set('search', searchValue.trim());
            } else {
                url.searchParams.delete('search');
            }
            url.searchParams.delete('page');
            window.history.pushState({}, '', url);
            
            updateWikiContent();
        },
        type: 'articles'
    });
    
    // Получаем теги для привязки событий
    getTags().then(tags => {
        attachFilterEvents(tags);
    });
    
    attachPaginationEvents(onPageChange);
};