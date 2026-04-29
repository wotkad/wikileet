import { getState } from '../state.js';
import { getUserArticles } from '../api.js';
import { escapeHtml, formatDate } from '../utils/utils.js';
import ArticleCard from '../components/ArticleCard.js';

export default async function ProfilePage() {
    const state = getState();
    const user = state.currentUser;
    
    if (!user) {
        window.router.navigate('/login');
        return '<div class="text-center py-12">Redirecting to login...</div>';
    }
    
    const userId = user._id || user.id;
    
    let articles = [];
    try {
        const articlesData = await getUserArticles(userId);
        articles = articlesData.articles || [];
    } catch (error) {
        console.error('Error loading articles:', error);
    }
    
    const registeredDate = formatDate(user.createdAt);
    const avatarUrl = user?.avatar ? `/api/profile/avatar/${user.avatar}?t=${Date.now()}` : '/api/profile/avatar/default-avatar.png';
    
    return `
        <div class="mx-auto">
            <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-8">
                <div class="flex items-center gap-6">
                    <div class="flex flex-col items-center space-y-4" id="avatar-upload-component">
                        <div class="relative group">
                            <img src="${avatarUrl}" 
                                 alt="${escapeHtml(user.name)}"
                                 class="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
                                 id="avatar-preview">
                            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition">
                                <button type="button" id="upload-avatar-btn" class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition">
                                    Change
                                </button>
                            </div>
                        </div>
                        <input type="file" id="avatar-input" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden">
                        <button type="button" id="remove-avatar-btn" class="text-sm text-red-400 hover:text-red-300 transition ${!user?.avatar ? 'hidden' : ''}">
                            Remove avatar
                        </button>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold" id="user-name-display">${escapeHtml(user.name)}</h1>
                        <p class="text-gray-300 mt-1" id="user-email-display">${escapeHtml(user.email)}</p>
                        <div class="flex gap-4 mt-3">
                            <span class="px-3 py-1 bg-blue-800 rounded-full text-sm">
                                ${user.role === 'admin' ? '👑 Administrator' : '📖 Member'}
                            </span>
                            <span class="px-3 py-1 bg-gray-700 rounded-full text-sm">
                                📅 Registered: ${registeredDate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Edit Profile Form -->
            <div class="bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">✏️ Edit Profile</h2>
                <form id="editProfileForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Name</label>
                        <input type="text" id="edit-name" value="${escapeHtml(user.name)}" required
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" id="edit-email" value="${escapeHtml(user.email)}" required
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                        Update Profile
                    </button>
                </form>
            </div>
            
            <!-- Change Password Form -->
            <div class="bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">🔒 Change Password</h2>
                <form id="changePasswordForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Current Password</label>
                        <input type="password" id="current-password" required
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">New Password</label>
                        <input type="password" id="new-password" required minlength="6"
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Confirm New Password</label>
                        <input type="password" id="confirm-password" required minlength="6"
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition">
                        Change Password
                    </button>
                </form>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-gray-800 rounded-lg p-6 text-center">
                    <div class="text-3xl font-bold text-blue-400">${articles.length}</div>
                    <div class="text-gray-400 mt-1">Articles Written</div>
                </div>
                <div class="bg-gray-800 rounded-lg p-6 text-center">
                    <div class="text-3xl font-bold text-green-400">
                        ${articles.filter(a => a.status === 'published').length}
                    </div>
                    <div class="text-gray-400 mt-1">Published Articles</div>
                </div>
                <div class="bg-gray-800 rounded-lg p-6 text-center">
                    <div class="text-3xl font-bold text-yellow-400">
                        ${articles.filter(a => a.status === 'draft').length}
                    </div>
                    <div class="text-gray-400 mt-1">Drafts</div>
                </div>
            </div>
            
            <!-- Recent Articles -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h2 class="text-2xl font-bold mb-4">📝 Recent Articles</h2>
                <div class="space-y-4">
                    ${articles.length > 0 ? 
                        articles.slice(0, 5).map(article => ArticleCard(article)).join('') : 
                        '<div class="text-center py-8 text-gray-400">No articles yet. Create your first article!</div>'
                    }
                </div>
                ${articles.length > 5 ? `
                    <div class="text-center mt-4">
                        <a href="/admin/articles" class="text-blue-400 hover:text-blue-300 transition">
                            View all ${articles.length} articles →
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}