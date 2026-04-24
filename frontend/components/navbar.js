import { getState } from '../state.js';

let currentNavbar = null;

export default function Navbar() {
    const state = getState();
    
    currentNavbar = `
        <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
            <div class="container mx-auto px-4 max-w-7xl">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center space-x-8">
                        <a href="/" class="text-xl font-bold hover:text-blue-400 transition">
                            📚 Knowledge Base
                        </a>
                        <div class="hidden md:flex space-x-4">
                            <a href="/" class="hover:text-blue-400 transition">Home</a>
                            <a href="/wiki" class="hover:text-blue-400 transition">Wiki</a>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4" id="navbar-user-section">
                        ${renderUserSection(state.currentUser)}
                    </div>
                </div>
            </div>
        </nav>
    `;
    
    return currentNavbar;
}

function renderUserSection(user) {
    if (!user) {
        return `
            <a href="/login" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition">
                Login
            </a>
            <a href="/register" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition">
                Register
            </a>
        `;
    }
    
    return `
        <span class="text-sm text-gray-300">
            👤 ${user.name || user.email}
        </span>
        ${user.role === 'admin' ? `
            <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">Admin</span>
        ` : ''}
        <button id="logoutBtn" class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition text-sm">
            Logout
        </button>
    `;
}

// Функция для обновления только секции пользователя
export function updateUserSection() {
    const userSection = document.getElementById('navbar-user-section');
    if (userSection) {
        const state = getState();
        userSection.innerHTML = renderUserSection(state.currentUser);
        
        // Перепривязываем обработчик logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && window.router) {
            logoutBtn.onclick = async (e) => {
                e.preventDefault();
                const { logout } = await import('../auth.js');
                await logout();
                updateUserSection(); // Обновляем секцию после логаута
                if (window.router && window.router.navigate) {
                    window.router.navigate('/login');
                }
            };
        }
    }
}