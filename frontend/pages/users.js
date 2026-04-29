import { escapeHtml, debounce } from '../utils/utils.js';

let currentFilters = {
    search: '',
    role: 'all',
    sort: '-createdAt',
    page: 1,
};

// Создаем debounced функцию поиска
const performSearch = debounce(() => {
    const params = new URLSearchParams();
    if (currentFilters.search) params.set('search', currentFilters.search);
    if (currentFilters.role && currentFilters.role !== 'all') params.set('role', currentFilters.role);
    if (currentFilters.sort) params.set('sort', currentFilters.sort);
    if (currentFilters.page > 1) params.set('page', currentFilters.page);
    
    window.router.navigate(`/users?${params.toString()}`);
}, 500);

// API функции
async function getUsers(filters) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page);
    params.append('limit', '20');
    
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
        return '<div class="text-center py-8 text-gray-400">No users found</div>';
    }
    
    return users.map(user => `
        <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
            <div class="flex items-start gap-4">
                <img src="${user.avatar ? `/api/profile/avatar/${user.avatar}` : '/api/profile/avatar/default-avatar.png'}" 
                     alt="${escapeHtml(user.name)}"
                     class="w-12 h-12 rounded-full object-cover">
                <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <a href="/profile/${user.slug}" class="text-lg font-semibold hover:text-blue-400 transition">
                            ${escapeHtml(user.name)}
                        </a>
                        ${user.role === 'admin' ? 
                            '<span class="px-2 py-0.5 bg-purple-900 text-purple-300 rounded-full text-xs">Admin</span>' : 
                            '<span class="px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full text-xs">Member</span>'
                        }
                    </div>
                    <div class="text-sm text-gray-400 mt-1">${escapeHtml(user.email)}</div>
                    <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span>📅 Joined: ${new Date(user.createdAt).toLocaleDateString()}</span>
                        <span>📝 ${user.articlesCount || 0} articles</span>
                        <span>👁️ ${user.totalViews || 0} total views</span>
                    </div>
                </div>
                <a href="/profile/${user.slug}" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition whitespace-nowrap">
                    View Profile
                </a>
            </div>
        </div>
    `).join('');
}

function renderPagination(data) {
    return `
        <div class="flex justify-center gap-2 mt-8">
            ${Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => i + 1).map(page => `
                <button class="page-btn px-3 py-1 rounded ${page === currentFilters.page ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}"
                        data-page="${page}">
                    ${page}
                </button>
            `).join('')}
        </div>
    `;
}

export default async function UsersPage() {
    const urlParams = new URLSearchParams(window.location.search);
    
    currentFilters = {
        search: urlParams.get('search') || '',
        role: urlParams.get('role') || 'all',
        sort: urlParams.get('sort') || '-createdAt',
        page: parseInt(urlParams.get('page')) || 1,
    };
    
    const [usersData, stats] = await Promise.all([
        getUsers(currentFilters),
        getUserStats()
    ]);
    
    return `
        <div class="mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-bold mb-2">👥 Community Members</h1>
                <p class="text-gray-400">${stats.totalUsers || 0} total members</p>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-blue-400">${stats.totalUsers || 0}</div>
                    <div class="text-sm text-gray-400">Total Members</div>
                </div>
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-purple-400">${stats.adminCount || 0}</div>
                    <div class="text-sm text-gray-400">Administrators</div>
                </div>
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-green-400">${stats.userCount || 0}</div>
                    <div class="text-sm text-gray-400">Members</div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="bg-gray-800 rounded-lg p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Search by name</label>
                        <input type="text" 
                               id="searchInput" 
                               placeholder="Search users..." 
                               autocomplete="off"
                               value="${escapeHtml(currentFilters.search)}"
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Filter by role</label>
                        <select id="roleFilter" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all" ${currentFilters.role === 'all' ? 'selected' : ''}>All users</option>
                            <option value="admin" ${currentFilters.role === 'admin' ? 'selected' : ''}>Administrators</option>
                            <option value="user" ${currentFilters.role === 'user' ? 'selected' : ''}>Members</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Sort by</label>
                        <select id="sortFilter" class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="-createdAt" ${currentFilters.sort === '-createdAt' ? 'selected' : ''}>Newest first</option>
                            <option value="createdAt" ${currentFilters.sort === 'createdAt' ? 'selected' : ''}>Oldest first</option>
                            <option value="name" ${currentFilters.sort === 'name' ? 'selected' : ''}>Name A-Z</option>
                            <option value="-name" ${currentFilters.sort === '-name' ? 'selected' : ''}>Name Z-A</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Users List -->
            <div class="space-y-3" id="users-list">
                ${renderUsersList(usersData.users)}
            </div>
            
            ${usersData.totalPages > 1 ? renderPagination(usersData) : ''}
        </div>
    `;
}

window.initUsersPage = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const currentValue = searchInput.value;
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.value = currentValue;
        
        newSearchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            currentFilters.page = 1;
            performSearch();
        });
        
        newSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        
        newSearchInput.focus();
        const len = newSearchInput.value.length;
        newSearchInput.setSelectionRange(len, len);
    }
    
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        const newRoleFilter = roleFilter.cloneNode(true);
        roleFilter.parentNode.replaceChild(newRoleFilter, roleFilter);
        
        newRoleFilter.addEventListener('change', (e) => {
            currentFilters.role = e.target.value;
            currentFilters.page = 1;
            const params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.role && currentFilters.role !== 'all') params.set('role', currentFilters.role);
            if (currentFilters.sort) params.set('sort', currentFilters.sort);
            
            window.router.navigate(`/users?${params.toString()}`);
        });
    }
    
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        const newSortFilter = sortFilter.cloneNode(true);
        sortFilter.parentNode.replaceChild(newSortFilter, sortFilter);
        
        newSortFilter.addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
            currentFilters.page = 1;
            const params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.role && currentFilters.role !== 'all') params.set('role', currentFilters.role);
            if (currentFilters.sort) params.set('sort', currentFilters.sort);
            
            window.router.navigate(`/users?${params.toString()}`);
        });
    }
    
    document.querySelectorAll('.page-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', () => {
            currentFilters.page = parseInt(newBtn.dataset.page);
            const params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.role && currentFilters.role !== 'all') params.set('role', currentFilters.role);
            if (currentFilters.sort) params.set('sort', currentFilters.sort);
            if (currentFilters.page > 1) params.set('page', currentFilters.page);
            
            window.router.navigate(`/users?${params.toString()}`);
        });
    });
};