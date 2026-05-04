import { getState } from '../state.js';
import { UPLOAD, USER_ROLES } from '../constants.js';
import { escapeHtml } from '../utils/utils.js';
import { renderSearchInput, initSearchInput } from './Search.js';
import { renderHotkeysInfo, initHotkeysInfo, updateHotkeysTooltip } from './HotkeysInfo.js';

// Функция для проверки доступа к админ-панели (admin или superadmin)
function hasAdminAccess(user) {
    return user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPERADMIN);
}

export default function Header() {
    const state = getState();
    
    return `
        <header class="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
            <div class="h-16 px-6 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <button id="sidebarToggle" class="lg:hidden text-gray-300 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <a href="/" class="text-xl font-bold hover:text-blue-400 transition">
                        📚 База знаний
                    </a>
                </div>
                <div class="flex-1 max-w-md mx-4 relative">
                    ${renderSearchInput({
                        id: 'header-search-input',
                        suggestionsId: 'header-search-suggestions',
                        placeholder: 'Поиск статей...',
                        className: 'w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })}
                </div>
                <div class="flex items-center gap-x-3">
                    ${renderHotkeysInfo()}
                    <div class="flex items-center gap-x-2" id="header-user-section">
                        ${renderUserSection(state.currentUser)}
                    </div>
                </div>
            </div>
        </header>
    `;
}

function renderUserSection(user) {
    if (!user) {
        return `
            <a href="/login" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition text-sm">
                Войти
            </a>
            <a href="/register" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition text-sm">
                Зарегистрироваться
            </a>
        `;
    }
    
    const avatarUrl = user?.avatar ? `/api/profile/avatar/${user.avatar}` : UPLOAD.DEFAULT_AVATAR;
    const showAdminPanel = hasAdminAccess(user);
    
    return `
        <div class="relative group">
            <button class="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition text-sm">
                <img src="${avatarUrl}" alt="${escapeHtml(user.name)}" class="w-6 h-6 rounded-full object-cover">
                <span>${escapeHtml(user.name)}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div class="absolute pt-2 right-0 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden hidden group-hover:block z-50">
                <div class="mt-2">
                    <a href="/profile" class="block px-4 py-2 hover:bg-gray-700 transition text-sm">
                        👤 Профиль
                    </a>
                    ${showAdminPanel ? `
                        <a href="/admin/articles" class="block px-4 py-2 hover:bg-gray-700 transition text-sm">
                            ⚙️ Админ панель
                        </a>
                    ` : ''}
                    <hr class="border-gray-700">
                    <button id="logoutBtn" class="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-sm text-red-400">
                        🚪 Выйти
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Функция для инициализации поиска в хедере
export function initHeaderSearch() {
    initSearchInput({
        id: 'header-search-input',
        suggestionsId: 'header-search-suggestions',
        onSearch: (searchValue) => {
            if (searchValue && searchValue.trim()) {
                window.router.navigate(`/wiki?search=${encodeURIComponent(searchValue.trim())}`);
            } else {
                window.router.navigate('/wiki');
            }
        },
        submitOnly: true,
        type: 'articles'
    });
}

// Функция для фокуса на поиск (для горячей клавиши)
export function focusSearch() {
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

// Инициализация подсказки горячих клавиш
export function initHeaderHotkeysInfo() {
    const state = getState();
    const path = window.location.pathname;
    const isOnArticlePage = path.startsWith('/wiki/') && path !== '/wiki';
    initHotkeysInfo(state.currentUser, isOnArticlePage);
}

// Обновление подсказки горячих клавиш
export function updateHeaderHotkeysTooltip() {
    const state = getState();
    const path = window.location.pathname;
    const isOnArticlePage = path.startsWith('/wiki/') && path !== '/wiki';
    updateHotkeysTooltip(state.currentUser, isOnArticlePage);
}

// Функция updateHeaderUser в Header.js
export function updateHeaderUser() {
    console.log('updateHeaderUser called');
    const userSection = document.getElementById('header-user-section');
    if (userSection) {
        const state = getState();
        userSection.innerHTML = renderUserSection(state.currentUser);
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
            
            newBtn.onclick = async (e) => {
                e.preventDefault();
                const { logout } = await import('../auth.js');
                await logout();
                updateHeaderUser();
                window.router.navigate('/');
            };
        }
    }
    
    // Обновляем подсказку горячих клавиш после смены пользователя
    setTimeout(() => {
        updateHeaderHotkeysTooltip();
    }, 100);
}

// Инициализируем подсказку при загрузке
if (typeof window !== 'undefined') {
    window.initHeaderSearch = initHeaderSearch;
    window.initHeaderHotkeysInfo = initHeaderHotkeysInfo;
    window.focusSearch = focusSearch;
    window.updateHeaderHotkeysTooltip = updateHeaderHotkeysTooltip;
}