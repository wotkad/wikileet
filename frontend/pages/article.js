import { escapeHtml, calculateReadTime, formatDate } from '../utils/utils.js';
import { getArticle } from '../api.js';
import ArticleCard from '../components/ArticleCard.js';
import FavoriteButton from '../components/FavoriteButton.js';
import { PAGINATION, UPLOAD } from '../constants.js';
import { getState } from '../state.js';
import { loadFavorites } from '../components/FavoriteButton.js';

export default async function ArticlePage(params) {
    try {
        const state = getState();
        const { article, similar } = await getArticle(params.slug);
        
        if (!article) {
            return `
                <div class="text-center py-12">
                    <h2 class="text-2xl font-bold text-red-400">Статья не найдена</h2>
                    <a href="/wiki" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Назад к записям</a>
                </div>
            `;
        }
        
        // Загружаем избранное для авторизованных пользователей
        if (state.currentUser) {
            await loadFavorites();
        }
        
        const readTime = article.readTime || calculateReadTime(article.content);
        const author = article.author || {};
        const authorAvatar = author.avatar ? `/api/profile/avatar/${author.avatar}` : UPLOAD.DEFAULT_AVATAR;
        const isLoggedIn = !!state.currentUser;
        
        // Обрезаем похожие статьи до лимита
        const similarArticles = (similar || []).slice(0, PAGINATION.SIMILAR_ARTICLES_LIMIT);
        
        return `
            <article class="mx-auto">
                <div class="flex justify-between items-start mb-4">
                    <a href="/wiki" class="inline-block text-blue-400 hover:text-blue-300 transition">
                        ← Назад к записям
                    </a>
                    ${isLoggedIn ? `
                        <div class="flex-shrink-0 ml-4">
                            ${FavoriteButton(article._id)}
                        </div>
                    ` : ''}
                </div>
                
                <div class="bg-gray-800 rounded-lg p-8">
                    <h1 class="text-4xl font-bold mb-4">${escapeHtml(article.title)}</h1>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        <a href="/wiki?category=${article.category?.slug}" class="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm hover:bg-blue-800 transition">
                            ${escapeHtml(article.category?.name || 'Без категории')}
                        </a>
                        ${article.tags?.map(tag => `
                            <a href="/wiki?tags=${tag.slug}" class="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition">
                                ${escapeHtml(tag.name)}
                            </a>
                        `).join('') || ''}
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 pb-4 border-b border-gray-700">
                        <div>📅 ${formatDate(article.createdAt)}</div>
                        <div>⏱️ ${readTime} мин</div>
                        <div>👁️ ${article.views} просмотров</div>
                        <div class="flex items-center gap-2">
                            <img src="${authorAvatar}" alt="${escapeHtml(author.name || 'Нет автора')}" class="w-5 h-5 rounded-full object-cover">
                            <span>${escapeHtml(author.name || author.email || 'Нет автора')}</span>
                        </div>
                    </div>
                    
                    <div class="prose max-w-none">
                        ${article.content}
                    </div>
                </div>
                
                ${similarArticles.length > 0 ? `
                    <div class="mt-8 bg-gray-800 rounded-lg p-6">
                        <h3 class="text-xl font-bold mb-4">Похожие записи</h3>
                        <div class="space-y-4">
                            ${similarArticles.map(art => ArticleCard(art)).join('')}
                        </div>
                    </div>
                ` : ''}
            </article>
        `;
    } catch (error) {
        console.error('Ошибка загрузки статьи:', error);
        return `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-red-400">Ошибка загрузки статьи</h2>
                <a href="/wiki" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Назад к записям</a>
            </div>
        `;
    }
}