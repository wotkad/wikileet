import { getState } from '../state.js';
import { getUserArticles } from '../api.js';
import { escapeHtml } from '../utils/utils.js';
import ArticleCard from '../components/ArticleCard.js';

export default async function ProfilePage() {
    const state = getState();
    const user = state.currentUser;
    
    console.log('Profile page - user:', user);
    
    if (!user) {
        window.router.navigate('/login');
        return '<div class="text-center py-12">Redirecting to login...</div>';
    }
    
    // Проверяем наличие id пользователя
    const userId = user._id || user.id;
    if (!userId) {
        console.error('User ID not found:', user);
        return '<div class="text-center py-12 text-red-400">Error: User ID not found</div>';
    }
    
    console.log('Fetching articles for user ID:', userId);
    
    // Получаем статьи пользователя
    let articles = [];
    try {
        const articlesData = await getUserArticles(userId);
        articles = articlesData.articles || [];
        console.log('Articles loaded:', articles.length);
    } catch (error) {
        console.error('Error loading articles:', error);
    }
    
    // Форматируем дату регистрации
    const registeredDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'Unknown';
    
    return `
        <div class="max-w-4xl mx-auto">
            <!-- Profile Header -->
            <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-8">
                <div class="flex items-center gap-6">
                    <div class="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl">
                        👤
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold">${escapeHtml(user.name || 'User')}</h1>
                        <p class="text-gray-300 mt-1">${escapeHtml(user.email || 'No email')}</p>
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
                ${articles.length > 0 ? `
                    <div class="space-y-4">
                        ${articles.slice(0, 5).map(article => `
                            <div class="border-b border-gray-700 pb-4 last:border-0">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <a href="/wiki/${article.slug}" class="text-lg font-semibold hover:text-blue-400 transition">
                                            ${escapeHtml(article.title)}
                                        </a>
                                        <div class="flex flex-wrap gap-2 mt-2 text-xs">
                                            ${renderStatusBadge(article.status)}
                                            <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded">${escapeHtml(article.category?.name || 'Uncategorized')}</span>
                                            <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">👁️ ${article.views || 0}</span>
                                            <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📅 ${new Date(article.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div class="flex gap-2 ml-4">
                                        <a href="/admin/articles/${article.slug}" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition">
                                            Edit
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${articles.length > 5 ? `
                        <div class="text-center mt-4">
                            <a href="/admin/articles" class="text-blue-400 hover:text-blue-300 transition">
                                View all ${articles.length} articles →
                            </a>
                        </div>
                    ` : ''}
                ` : `
                    <div class="text-center py-8 text-gray-400">
                        <p>You haven't written any articles yet.</p>
                        <a href="/admin/articles/new" class="inline-block mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition">
                            Create your first article →
                        </a>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderStatusBadge(status) {
    if (status === 'published') {
        return '<span class="px-2 py-0.5 bg-green-900 text-green-300 rounded-full text-xs font-medium">🚀 Published</span>';
    } else {
        return '<span class="px-2 py-0.5 bg-yellow-900 text-yellow-300 rounded-full text-xs font-medium">📝 Draft</span>';
    }
}