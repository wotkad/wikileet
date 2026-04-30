import { escapeHtml, calculateReadTime, truncateText } from '../utils/utils.js';
import { DISPLAY } from '../constants.js';

export default function ArticleCard(article) {
    const readTime = article.readTime || calculateReadTime(article.content);
    const author = article.author || {};
    const authorAvatar = author.avatar ? `/api/profile/avatar/${author.avatar}` : '/api/profile/avatar/default-avatar.png';
    const authorName = author.name || author.email || 'Unknown';
    const authorSlug = author.slug;
    
    const hasValidAuthor = authorSlug && authorName !== 'Unknown';
    
    // Показываем только первые N тегов
    const visibleTags = article.tags?.slice(0, DISPLAY.MAX_TAGS_IN_CARD) || [];
    
    return `
        <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
            <a href="/wiki/${article.slug}" class="block">
                <h3 class="text-lg font-semibold mb-2">${escapeHtml(article.title)}</h3>
                <p class="text-gray-400 text-sm mb-3">${truncateText(escapeHtml(article.description || 'No description'), DISPLAY.TRUNCATE_DESCRIPTION_LENGTH)}</p>
            </a>
            <div class="flex flex-wrap items-center gap-2 text-xs">
                <a href="/wiki?category=${article.category?.slug}" class="px-2 py-1 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition">
                    ${escapeHtml(article.category?.name || 'Uncategorized')}
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
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">⏱️ ${readTime} min read</span>
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
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📅 ${new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `;
}