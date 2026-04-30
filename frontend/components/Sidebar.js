import { escapeHtml } from '../utils/utils.js';
import { getState } from '../state.js';

export default function Sidebar() {
    const state = getState();
    const user = state.currentUser;
    const isAdmin = user?.role === 'admin';
    
    return `
        <aside class="sidebar w-64 bg-gray-800 border-r border-gray-700 fixed lg:relative lg:translate-x-0 transform -translate-x-full transition-transform duration-200 ease-in-out z-40 h-full overflow-y-auto" id="sidebar">
            <div class="p-4 space-y-6">
                <div>
                    <div class="space-y-2">
                        <a href="/" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                            <span>🏠</span>
                            <span>Главная</span>
                        </a>
                        <a href="/wiki" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                            <span>📚</span>
                            <span>Записи</span>
                        </a>
                        ${isAdmin ? `
                            <a href="/users" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                                <span>👥</span>
                                <span>Пользователи</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </aside>
    `;
}

// Функция для инициализации sidebar событий
export function initSidebarEvents() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleBtn && sidebar) {
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        newToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('translate-x-0');
        });
    }
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initSidebarEvents();
    });
}