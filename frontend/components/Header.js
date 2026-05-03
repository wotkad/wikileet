import { getState } from '../state.js';
import { UPLOAD, USER_ROLES } from '../constants.js';
import { escapeHtml } from '../utils/utils.js';

export default function Header() {
    const state = getState();
    
    return `
        <header class="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
            <div class="h-16 px-6 flex items-center justify-between">
                <div class="flex items-center">
                    <button id="sidebarToggle" class="lg:hidden text-gray-300 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <a href="/" class="text-xl font-bold hover:text-blue-400 transition">
                        📚 База знаний
                    </a>
                </div>
                <div class="flex items-center gap-x-2" id="header-user-section">
                    ${renderUserSection(state.currentUser)}
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
                Зарегестироваться
            </a>
        `;
    }
    
    const avatarUrl = user?.avatar ? `/api/profile/avatar/${user.avatar}` : UPLOAD.DEFAULT_AVATAR;
    
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
                    ${user.role === USER_ROLES.ADMIN ? `
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
}