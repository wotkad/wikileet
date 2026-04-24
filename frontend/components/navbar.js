import { getState } from '../state.js';
import { logout } from '../auth.js';
import router from '../router.js';

export default function Navbar() {
    const state = getState();

    return `
        <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
            <div class="container mx-auto px-4 max-w-7xl">
                <div class="flex justify-between items-center h-16">

                    <div class="flex items-center space-x-8">
                        <h1 class="text-xl font-bold cursor-pointer" onclick="router.navigate('/')">
                            📚 Knowledge Base
                        </h1>

                        <div class="hidden md:flex space-x-4">
                            <a href="/" onclick="router.navigate('/')">Home</a>
                            <a href="/wiki" onclick="router.navigate('/wiki')">Wiki</a>
                        </div>
                    </div>

                    <div class="flex items-center space-x-4">

                        ${
                            state.currentUser
                                ? `
                                    <span class="text-sm text-gray-300">
                                        ${state.currentUser.email}
                                    </span>

                                    ${
                                        state.currentUser.role === 'admin'
                                            ? `<span class="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">Admin</span>`
                                            : ''
                                    }

                                    <button id="logoutBtn" class="px-3 py-1 bg-red-600 rounded">
                                        Logout
                                    </button>
                                `
                                : `
                                    <a href="/login" onclick="router.navigate('/login')">Login</a>
                                    <a href="/register" onclick="router.navigate('/register')">Register</a>
                                `
                        }

                    </div>
                </div>
            </div>
        </nav>
    `;
}