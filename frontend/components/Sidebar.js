// Sidebar.js
import { escapeHtml } from '../utils/utils.js';
import { getState, subscribe } from '../state.js';
import { USER_ROLES } from '../constants.js';

// Функция для проверки доступа к админ-панели (admin или superadmin)
function hasAdminAccess(user) {
    return user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPERADMIN);
}

// Функция для рендеринга сайдбара
function renderSidebarContent(user) {
    const showAdminLinks = hasAdminAccess(user);
    
    return `
        <div class="p-4 space-y-6">
            <div>
                <div class="space-y-2">
                    <a href="/" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                        <span>🏠</span>
                        <span>Главная</span>
                    </a>
                    <a href="/wiki" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                        <span>📚</span>
                        <span>Статьи</span>
                    </a>
                    ${showAdminLinks ? `
                        <a href="/users" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                            <span>👥</span>
                            <span>Пользователи</span>
                        </a>
                        <a href="/media" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                            <span>🖼️</span>
                            <span>Медиатека</span>
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Обновление сайдбара при изменении состояния
export function updateSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const state = getState();
    const showAdminLinks = hasAdminAccess(state.currentUser);
    
    // Находим контейнер с ссылками
    const linksContainer = sidebar.querySelector('.space-y-2');
    if (!linksContainer) return;
    
    // Получаем основные ссылки
    const mainLinks = `
        <a href="/" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
            <span>🏠</span>
            <span>Главная</span>
        </a>
        <a href="/wiki" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
            <span>📚</span>
            <span>Статьи</span>
        </a>
    `;
    
    // Админские ссылки
    const adminLinks = showAdminLinks ? `
        <a href="/users" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
            <span>👥</span>
            <span>Пользователи</span>
        </a>
        <a href="/media" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
            <span>🖼️</span>
            <span>Медиатека</span>
        </a>
    ` : '';
    
    // Обновляем содержимое
    linksContainer.innerHTML = mainLinks + adminLinks;
}

export default function Sidebar() {
    const state = getState();
    const content = renderSidebarContent(state.currentUser);
    
    return `
        <aside class="sidebar w-64 bg-gray-800 border-r border-gray-700 fixed lg:relative lg:translate-x-0 transform -translate-x-full transition-transform duration-200 ease-in-out z-40 h-full overflow-y-auto" id="sidebar">
            <div class="sidebar-content">
                ${content}
            </div>
        </aside>
    `;
}

// Функция для инициализации sidebar событий
export function initSidebarEvents() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleBtn && sidebar) {
        // Удаляем старый обработчик, чтобы не было дублирования
        const newToggleBtn = toggleBtn.cloneNode(true);
        if (toggleBtn.parentNode) {
            toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        }
        
        newToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sidebar.classList.toggle('translate-x-0');
        });
    }
}

// Подписываемся на изменения состояния
if (typeof window !== 'undefined') {
    // Подписываемся на обновления состояния
    subscribe(() => {
        updateSidebar();
    });
    
    // Также слушаем событие logout для немедленной реакции
    window.addEventListener('user:logout', () => {
        updateSidebar();
    });
    
    document.addEventListener('DOMContentLoaded', () => {
        initSidebarEvents();
    });
}