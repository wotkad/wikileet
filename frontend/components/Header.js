import { getState } from '../state.js';

export default function Header() {
    const state = getState();
    
    return `
        <header class="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
            <div class="h-16 px-6 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <button id="sidebarToggle" class="lg:hidden text-gray-300 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <h1 class="text-xl font-bold cursor-pointer hover:text-blue-400 transition" data-view="home">
                        📚 Knowledge Base
                    </h1>
                </div>
                <div class="flex items-center space-x-4" id="header-user-section">
                    ${renderUserSection(state.currentUser)}
                </div>
            </div>
        </header>
    `;
}

function renderUserSection(user) {
    if (!user) {
        return `
            <button data-view="login" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition text-sm">
                Login
            </button>
            <button data-view="register" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition text-sm">
                Register
            </button>
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

export function updateHeaderUser() {
    const userSection = document.getElementById('header-user-section');
    if (userSection) {
        const state = getState();
        userSection.innerHTML = renderUserSection(state.currentUser);
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = async (e) => {
                e.preventDefault();
                console.log('Logout clicked');
                try {
                    const authModule = await import('../auth.js');
                    await authModule.logout();
                    console.log('Logout successful');
                    updateHeaderUser();
                    const contentModule = await import('./ContentArea.js');
                    contentModule.loadContent('home');
                } catch (error) {
                    console.error('Logout error:', error);
                }
            };
        }
    }
}