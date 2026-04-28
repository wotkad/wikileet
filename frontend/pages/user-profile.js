import { getUserBySlug, getUserArticles } from '../api.js';
import { escapeHtml } from '../utils/utils.js';
import { isUserOnline, forceUpdateStatus } from '../socket.js';

export default async function UserProfilePage(params) {
    const slug = params.slug;
    
    if (!slug) {
        window.router.navigate('/');
        return '<div class="text-center py-12">Loading...</div>';
    }
    
    try {
        const user = await getUserBySlug(slug);
        
        if (!user) {
            return `
                <div class="text-center py-12">
                    <h2 class="text-2xl font-bold text-red-400">User not found</h2>
                    <a href="/" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Back to Home</a>
                </div>
            `;
        }
        
        // Получаем статус онлайн
        const online = isUserOnline(user._id);
        const lastSeen = new Date(user.lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
        
        let statusHtml = '';
        if (online) {
            statusHtml = '<span class="flex items-center gap-1 text-green-400"><span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online now</span>';
        } else if (diffMinutes < 60) {
            statusHtml = `<span class="text-gray-400">Last seen ${diffMinutes} minutes ago</span>`;
        } else if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            statusHtml = `<span class="text-gray-400">Last seen ${hours} hours ago</span>`;
        } else {
            const days = Math.floor(diffMinutes / 1440);
            statusHtml = `<span class="text-gray-400">Last seen ${days} days ago</span>`;
        }
        
        // Получаем статьи пользователя
        let articles = [];
        try {
            const articlesData = await getUserArticles(user._id);
            articles = articlesData.articles || [];
        } catch (error) {
            console.error('Error loading articles:', error);
        }
        
        // Фильтруем только опубликованные статьи для публичного просмотра
        const publishedArticles = articles.filter(a => a.status === 'published');
        
        const registeredDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Unknown';
        
        const avatarUrl = user?.avatar ? `/api/profile/avatar/${user.avatar}?t=${Date.now()}` : '/api/profile/avatar/default-avatar.png';
        
        // Определяем отображение роли
        const roleDisplay = user.role === 'admin' ? '👑 Administrator' : '📖 Member';
        const roleBadgeClass = user.role === 'admin' ? 'bg-purple-900 text-purple-300' : 'bg-blue-800 text-blue-300';
        
        return `
            <div class="max-w-4xl mx-auto">
                <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-8">
                    <div class="flex items-center gap-6">
                        <div class="flex flex-col items-center space-y-4">
                            <img src="${avatarUrl}" 
                                 alt="${escapeHtml(user.name)}"
                                 class="w-32 h-32 rounded-full object-cover border-4 border-gray-700">
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold">${escapeHtml(user.name)}</h1>
                            <p class="text-gray-300 mt-1">${escapeHtml(user.email)}</p>
                            <div class="flex gap-4 mt-3">
                                <span class="px-3 py-1 ${user.role === 'admin' ? 'bg-purple-900 text-purple-300' : 'bg-blue-800 text-blue-300'} rounded-full text-sm">
                                    ${user.role === 'admin' ? '👑 Administrator' : '📖 Member'}
                                </span>
                                <span class="px-3 py-1 bg-gray-700 rounded-full text-sm">
                                    📅 Joined: ${registeredDate}
                                </span>
                                <span class="px-3 py-1 bg-gray-700 rounded-full text-sm">
                                    ${statusHtml}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-gray-800 rounded-lg p-6 text-center">
                        <div class="text-3xl font-bold text-blue-400">${publishedArticles.length}</div>
                        <div class="text-gray-400 mt-1">Articles Published</div>
                    </div>
                    <div class="bg-gray-800 rounded-lg p-6 text-center">
                        <div class="text-3xl font-bold text-green-400">
                            ${publishedArticles.reduce((sum, a) => sum + (a.views || 0), 0)}
                        </div>
                        <div class="text-gray-400 mt-1">Total Views</div>
                    </div>
                    <div class="bg-gray-800 rounded-lg p-6 text-center">
                        <div class="text-3xl font-bold text-purple-400">
                            ${publishedArticles.reduce((sum, a) => sum + (a.readTime || 1), 0)}
                        </div>
                        <div class="text-gray-400 mt-1">Minutes of Reading</div>
                    </div>
                </div>
                
                <!-- Articles List -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-4">📝 Articles by ${escapeHtml(user.name)}</h2>
                    ${publishedArticles.length > 0 ? `
                        <div class="space-y-4">
                            ${publishedArticles.slice(0, 10).map(article => `
                                <div class="border-b border-gray-700 pb-4 last:border-0">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <a href="/wiki/${article.slug}" class="text-lg font-semibold hover:text-blue-400 transition">
                                                ${escapeHtml(article.title)}
                                            </a>
                                            <p class="text-gray-400 text-sm mt-1">${escapeHtml(article.description || 'No description')}</p>
                                            <div class="flex flex-wrap gap-2 mt-2 text-xs">
                                                <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded">${escapeHtml(article.category?.name || 'Uncategorized')}</span>
                                                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">👁️ ${article.views || 0}</span>
                                                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">⏱️ ${article.readTime || 1} min read</span>
                                                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📅 ${new Date(article.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${publishedArticles.length > 10 ? `
                            <div class="text-center mt-4">
                                <a href="/wiki?author=${user._id}" class="text-blue-400 hover:text-blue-300 transition">
                                    View all ${publishedArticles.length} articles →
                                </a>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="text-center py-8 text-gray-400">
                            <p>${escapeHtml(user.name)} hasn't published any articles yet.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading user profile:', error);
        return `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-red-400">Error loading profile</h2>
                <a href="/" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Back to Home</a>
            </div>
        `;
    }

    // Принудительно обновляем статус при загрузке страницы
    setTimeout(() => {
        forceUpdateStatus();
    }, 100);
    
    // Подписываемся на обновления статуса
    const handleStatusUpdate = () => {
        const statusContainer = document.getElementById('user-status-container');
        if (statusContainer) {
            const online = isUserOnline(user._id);
            const lastSeen = new Date(user.lastSeen);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
            
            let statusHtml = '';
            if (online) {
                statusHtml = '<span class="flex items-center gap-1 text-green-400"><span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online now</span>';
            } else if (diffMinutes < 1) {
                statusHtml = '<span class="text-gray-400">Just now</span>';
            } else if (diffMinutes < 60) {
                statusHtml = `<span class="text-gray-400">Last seen ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago</span>`;
            } else if (diffMinutes < 1440) {
                const hours = Math.floor(diffMinutes / 60);
                statusHtml = `<span class="text-gray-400">Last seen ${hours} hour${hours !== 1 ? 's' : ''} ago</span>`;
            } else {
                const days = Math.floor(diffMinutes / 1440);
                statusHtml = `<span class="text-gray-400">Last seen ${days} day${days !== 1 ? 's' : ''} ago</span>`;
            }
            
            statusContainer.innerHTML = statusHtml;
        }
    };
    
    window.addEventListener('onlineUsersUpdated', handleStatusUpdate);
    
    // Очистка при уходе со страницы
    return () => {
        window.removeEventListener('onlineUsersUpdated', handleStatusUpdate);
    };
}