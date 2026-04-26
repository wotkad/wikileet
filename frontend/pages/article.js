import { getArticle } from '../api.js';

export default async function ArticlePage(params) {
    try {
        const { article, similar } = await getArticle(params.slug);
        
        if (!article) {
            return `
                <div class="text-center py-12">
                    <h2 class="text-2xl font-bold text-red-400">Article not found</h2>
                    <a href="/wiki" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Back to Wiki</a>
                </div>
            `;
        }
        
        return `
            <article class="max-w-4xl mx-auto">
                <a href="/wiki" class="inline-block mb-4 text-blue-400 hover:text-blue-300 transition">
                    ← Back to articles
                </a>
                
                <div class="bg-gray-800 rounded-lg p-8">
                    <h1 class="text-4xl font-bold mb-4">${escapeHtml(article.title)}</h1>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        <a href="/wiki?category=${article.category?.slug}" class="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm hover:bg-blue-800 transition">
                            ${escapeHtml(article.category?.name || 'Uncategorized')}
                        </a>
                        ${article.tags?.map(tag => `
                            <a href="/wiki?tags=${tag.slug}" class="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition">
                                ${escapeHtml(tag.name)}
                            </a>
                        `).join('') || ''}
                    </div>
                    
                    <div class="text-sm text-gray-400 mb-6 space-y-1">
                        <div>📅 ${new Date(article.createdAt).toLocaleDateString()}</div>
                        <div>👁️ ${article.views} views</div>
                        <div>✍️ By ${escapeHtml(article.author?.name || article.author?.email || 'Unknown')}</div>
                    </div>
                    
                    <div class="prose max-w-none">
                        ${article.content}
                    </div>
                </div>
                
                ${similar && similar.length > 0 ? `
                    <div class="mt-8 bg-gray-800 rounded-lg p-6">
                        <h3 class="text-xl font-bold mb-4">Similar Articles</h3>
                        <div class="space-y-3">
                            ${similar.map(art => `
                                <a href="/wiki/${art.slug}" class="block hover:bg-gray-700 p-3 rounded transition">
                                    <h4 class="font-semibold">${escapeHtml(art.title)}</h4>
                                    <p class="text-sm text-gray-400">${escapeHtml(art.category?.name || 'Uncategorized')}</p>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </article>
        `;
    } catch (error) {
        console.error('Error loading article:', error);
        return `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-red-400">Error loading article</h2>
                <a href="/wiki" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Back to Wiki</a>
            </div>
        `;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}