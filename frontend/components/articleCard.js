import { escapeHtml, calculateReadTime, truncateText, formatDate } from '../utils/utils.js';
import { DISPLAY, UPLOAD } from '../constants.js';
import { getState } from '../state.js';
import FavoriteButton from './FavoriteButton.js';

export default function ArticleCard(article) {
    const readTime = article.readTime || calculateReadTime(article.content);
    const author = article.author || {};
    const authorAvatar = author.avatar ? `/api/profile/avatar/${author.avatar}` : UPLOAD.DEFAULT_AVATAR;
    const authorName = author.name || author.email || 'Неизвестно';
    const authorSlug = author.slug;
    
    const hasValidAuthor = authorSlug && authorName !== 'Неизвестно';
    // Показываем только первые N тегов
    const visibleTags = article.tags?.slice(0, DISPLAY.MAX_TAGS_IN_CARD) || [];
    
    const state = getState();
    const currentUser = state.currentUser;
    const isLoggedIn = !!currentUser;
    
    return `
        <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition relative">
            ${isLoggedIn ? `
                <div class="absolute top-2 right-2 z-10">
                    ${FavoriteButton(article._id)}
                </div>
            ` : ''}
            
            <a href="/wiki/${article.slug}" class="block">
                <h3 class="text-lg font-semibold mb-2 pr-8">${escapeHtml(article.title)}</h3>
                <p class="text-gray-400 text-sm mb-3">${truncateText(escapeHtml(article.description || 'Нет описания'), DISPLAY.TRUNCATE_DESCRIPTION_LENGTH)}</p>
            </a>
            
            <div class="flex flex-wrap items-center gap-2 text-xs">
                <a href="/wiki?category=${article.category?.slug}" class="px-2 py-1 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition">
                    ${escapeHtml(article.category?.name || 'Без категории')}
                </a>
                ${visibleTags.map(tag => `
                    <a href="/wiki?tags=${tag.slug}" class="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition">
                        ${escapeHtml(tag.name)}
                    </a>
                `).join('')}
                ${article.tags?.length > DISPLAY.MAX_TAGS_IN_CARD ? `
                    <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        +${article.tags.length - DISPLAY.MAX_TAGS_IN_CARD}
                    </span>
                ` : ''}
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">👁️ ${article.views || 0}</span>
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">⏱️ ${readTime} мин чтения</span>
                ${hasValidAuthor ? `
                    <a href="/profile/${authorSlug}" class="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition">
                        <img src="${authorAvatar}" alt="${escapeHtml(authorName)}" class="w-4 h-4 rounded-full object-cover">
                        <span>${escapeHtml(authorName)}</span>
                    </a>
                ` : `
                    <div class="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded">
                        <img src="${authorAvatar}" alt="${escapeHtml(authorName)}" class="w-4 h-4 rounded-full object-cover">
                        <span>${escapeHtml(authorName)}</span>
                    </div>
                `}
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📅 ${formatDate(article.createdAt)}</span>
            </div>
        </div>
    `;
}