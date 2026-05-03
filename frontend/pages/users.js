import { PAGINATION, SEARCH, UPLOAD, USER_ROLES, USER_ROLES_TITLE } from '../constants.js';
import { escapeHtml, debounce, formatDate, getArticlesDeclension, getViewsDeclension, getUsersDeclension } from '../utils/utils.js';
import { renderPagination, attachPaginationEvents } from '../components/Pagination.js';
import { renderSearchInput, initSearchInput } from '../components/Search.js';

let currentFilters = {
    search: '',
    role: 'all',
    sort: '-createdAt',
    page: 1,
    limit: PAGINATION.USERS_LIMIT
};

// Функция для обновления только контента
async function updateUsersContent() {
    const [usersData, stats] = await Promise.all([
        getUsers(currentFilters),
        getUserStats()
    ]);
    
    const usersList = document.getElementById('users-list');
    if (usersList) {
        usersList.innerHTML = renderUsersList(usersData.users);
    }
    
    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
        const newPagination = renderPagination(currentFilters.page, usersData.totalPages);
        if (newPagination) {
            paginationContainer.innerHTML = newPagination;
            attachPaginationEvents(onPageChange);
        } else if (paginationContainer.parentNode) {
            paginationContainer.innerHTML = '';
        }
    }
}

function onPageChange(page) {
    currentFilters.page = page;
    
    const url = new URL(window.location.href);
    if (page > 1) {
        url.searchParams.set('page', page);
    } else {
        url.searchParams.delete('page');
    }
    window.history.pushState({}, '', url);
    
    updateUsersContent();
}

function onSearch(searchValue) {
    currentFilters.search = searchValue;
    currentFilters.page = 1;
    
    const url = new URL(window.location.href);
    if (searchValue) {
        url.searchParams.set('search', searchValue);
    } else {
        url.searchParams.delete('search');
    }
    url.searchParams.delete('page');
    window.history.pushState({}, '', url);
    
    updateUsersContent();
}

async function getUsers(filters) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page);
    params.append('limit', filters.limit || PAGINATION.USERS_LIMIT);
    
    const response = await fetch(`/api/profile/users?${params.toString()}`, {
        credentials: 'include'
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    
    return response.json();
}

async function getUserStats() {
    const response = await fetch('/api/profile/users/stats', {
        credentials: 'include'
    });
    
    if (!response.ok) {
        return { totalUsers: 0, adminCount: 0, userCount: 0 };
    }
    
    return response.json();
}

function renderUsersList(users) {
    if (!users || users.length === 0) {
        return '<div class="text-center py-8 text-gray-400">Пользователей не найдено</div>';
    }
    
    return users.map(user => {
        const articlesText = getArticlesDeclension(user.articlesCount);
        const viewsText = getViewsDeclension(user.totalViews);
        
        return `
            <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
                <div class="flex items-start gap-4">
                    <img src="${user.avatar ? `/api/profile/avatar/${user.avatar}` : UPLOAD.DEFAULT_AVATAR}" 
                         alt="${escapeHtml(user.name)}"
                         class="w-12 h-12 rounded-full object-cover">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <a href="/profile/${user.slug}" class="text-lg font-semibold hover:text-blue-400 transition">
                                ${escapeHtml(user.name)}
                            </a>
                            ${user.role === USER_ROLES.ADMIN ? 
                                `<span class="px-2 py-0.5 bg-purple-900 text-purple-300 rounded-full text-xs">${USER_ROLES_TITLE.ADMIN}</span>` : 
                                `<span class="px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full text-xs">${USER_ROLES_TITLE.USER}</span>`
                            }
                        </div>
                        <div class="text-sm text-gray-400 mt-1">${escapeHtml(user.email)}</div>
                        <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            <span>📅 Зарегистрирован: ${formatDate(user.createdAt)}</span>
                            <span>📝 ${articlesText}</span>
                            <span>👁️ ${viewsText}</span>
                        </div>
                    </div>
                    <a href="/profile/${user.slug}" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition whitespace-nowrap">
                        Профиль
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

export default async function UsersPage() {
    const urlParams = new URLSearchParams(window.location.search);
    
    currentFilters = {
        search: urlParams.get('search') || '',
        role: urlParams.get('role') || 'all',
        sort: urlParams.get('sort') || '-createdAt',
        page: parseInt(urlParams.get('page')) || 1,
        limit: PAGINATION.USERS_LIMIT
    };
    
    const [usersData, stats] = await Promise.all([
        getUsers(currentFilters),
        getUserStats()
    ]);
    
    return `
        <div class="mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-bold mb-2">👥 Пользователи</h1>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Поиск по имени</label>
                        ${renderSearchInput({
                            id: 'searchInput',
                            placeholder: 'Введите имя',
                            initialValue: currentFilters.search,
                            className: 'w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        })}
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Показать по роли</label>
                        <select id="roleFilter" class="h-10 w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all" ${currentFilters.role === 'all' ? 'selected' : ''}>Все пользователи</option>
                            <option value="admin" ${currentFilters.role === USER_ROLES.ADMIN ? 'selected' : ''}>Администраторы</option>
                            <option value="user" ${currentFilters.role === USER_ROLES.USER ? 'selected' : ''}>Пользователи</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Показать сначала</label>
                        <select id="sortFilter" class="h-10 w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="-createdAt" ${currentFilters.sort === '-createdAt' ? 'selected' : ''}>Самые новые</option>
                            <option value="createdAt" ${currentFilters.sort === 'createdAt' ? 'selected' : ''}>Самые старые</option>
                            <option value="name" ${currentFilters.sort === 'name' ? 'selected' : ''}>От А до Я</option>
                            <option value="-name" ${currentFilters.sort === '-name' ? 'selected' : ''}>От Я до А</option>
                        </select>
                    </div>
                </div>
            </div>
            <p class="text-gray-400 mt-2 mb-6 articles-count">${getUsersDeclension(stats.totalUsers)}</p>
            <div class="space-y-3" id="users-list">
                ${renderUsersList(usersData.users)}
            </div>
            
            <div class="pagination-container">
                ${renderPagination(currentFilters.page, usersData.totalPages)}
            </div>
        </div>
    `;
}

window.initUsersPage = function() {
    // Инициализация поиска
    initSearchInput({
        id: 'searchInput',
        onSearch: onSearch,
        type: 'users'
    });
    
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        const newRoleFilter = roleFilter.cloneNode(true);
        roleFilter.parentNode.replaceChild(newRoleFilter, roleFilter);
        
        newRoleFilter.addEventListener('change', async (e) => {
            currentFilters.role = e.target.value;
            currentFilters.page = 1;
            
            const url = new URL(window.location.href);
            if (currentFilters.role && currentFilters.role !== 'all') {
                url.searchParams.set('role', currentFilters.role);
            } else {
                url.searchParams.delete('role');
            }
            url.searchParams.delete('page');
            window.history.pushState({}, '', url);
            
            await updateUsersContent();
        });
    }
    
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        const newSortFilter = sortFilter.cloneNode(true);
        sortFilter.parentNode.replaceChild(newSortFilter, sortFilter);
        
        newSortFilter.addEventListener('change', async (e) => {
            currentFilters.sort = e.target.value;
            currentFilters.page = 1;
            
            const url = new URL(window.location.href);
            url.searchParams.set('sort', currentFilters.sort);
            url.searchParams.delete('page');
            window.history.pushState({}, '', url);
            
            await updateUsersContent();
        });
    }
    
    attachPaginationEvents(onPageChange);
};