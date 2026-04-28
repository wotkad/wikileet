import { getUserBySlug, getUserArticles } from '../api.js';
import { escapeHtml, formatDate } from '../utils/utils.js';
import ArticleCard from '../components/ArticleCard.js';

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
        
        let articles = [];
        try {
            const articlesData = await getUserArticles(user._id);
            articles = articlesData.articles || [];
        } catch (error) {
            console.error('Error loading articles:', error);
        }
        
        const publishedArticles = articles.filter(a => a.status === 'published');
        const registeredDate = formatDate(user.createdAt);
        const avatarUrl = user?.avatar ? `/api/profile/avatar/${user.avatar}?t=${Date.now()}` : '/api/profile/avatar/default-avatar.png';
        
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
                                <span class="px-3 py-1 ${roleBadgeClass} rounded-full text-sm">
                                    ${roleDisplay}
                                </span>
                                <span class="px-3 py-1 bg-gray-700 rounded-full text-sm">
                                    📅 Joined: ${registeredDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
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
                
                <div class="bg-gray-800 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-4">📝 Articles by ${escapeHtml(user.name)}</h2>
                    <div class="space-y-4">
                        ${publishedArticles.length > 0 ? 
                            publishedArticles.map(article => ArticleCard(article)).join('') : 
                            '<div class="text-center py-8 text-gray-400">No articles published yet</div>'
                        }
                    </div>
                    ${publishedArticles.length > 10 ? `
                        <div class="text-center mt-4">
                            <a href="/wiki?author=${user._id}" class="text-blue-400 hover:text-blue-300 transition">
                                View all ${publishedArticles.length} articles →
                            </a>
                        </div>
                    ` : ''}
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
}