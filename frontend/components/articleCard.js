import { escapeHtml } from '../../utils/utils.js';

export default function ArticleCard(article) {
    return `
        <a href="/wiki/${article.slug}" class="block bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
            <h3 class="text-lg font-semibold mb-2">${escapeHtml(article.title)}</h3>
            <p class="text-gray-400 text-sm mb-3">${escapeHtml(article.description || 'No description')}</p>
            <div class="flex flex-wrap gap-2 text-xs">
                <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded">
                    ${escapeHtml(article.category?.name || 'Uncategorized')}
                </span>
                ${article.tags?.slice(0, 3).map(tag => `
                    <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        ${escapeHtml(tag.name)}
                    </span>
                `).join('') || ''}
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">👁️ ${article.views || 0}</span>
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📅 ${new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
        </a>
    `;
}