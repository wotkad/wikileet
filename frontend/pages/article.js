import { getArticle } from '../api.js';
import router from '../router.js';

export default async function ArticlePage(params) {
    try {
        const { article, similar } = await getArticle(params.slug);
        
        return `
            <div class="max-w-4xl mx-auto">
                <nav class="text-sm text-gray-400 mb-6">
                    <a href="/" onclick="window.router.navigate('/')" class="hover:text-blue-400">Home</a> /
                    <a href="/wiki" onclick="window.router.navigate('/wiki')" class="hover:text-blue-400">Wiki</a> /
                    <span class="text-gray-300">${article.title}</span>
                </nav>

                <article class="bg-gray-800 rounded-lg p-8 mb-8">
                    <h1 class="text-4xl font-bold mb-4">${article.title}</h1>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm">
                            ${article.category.name}
                        </span>
                        ${article.tags.map(tag => `
                            <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                                ${tag.name}
                            </span>
                        `).join('')}
                    </div>

                    <div class="text-sm text-gray-400 mb-6 space-y-1">
                        <div>📅 Created: ${new Date(article.createdAt).toLocaleDateString()}</div>
                        <div>🔄 Updated: ${new Date(article.updatedAt).toLocaleDateString()}</div>
                        <div>👁️ Views: ${article.views}</div>
                        <div>✍️ Author: ${article.author.email}</div>
                    </div>

                    <div class="prose max-w-none">
                        ${article.content}
                    </div>
                </article>

                ${similar.length > 0 ? `
                    <div class="bg-gray-800 rounded-lg p-6">
                        <h3 class="text-xl font-bold mb-4">Similar Articles</h3>
                        <div class="grid gap-4">
                            ${similar.map(art => `
                                <div class="hover:bg-gray-750 p-3 rounded-lg transition cursor-pointer"
                                     onclick="window.router.navigate('/wiki/${art.slug}')">
                                    <h4 class="font-semibold">${art.title}</h4>
                                    <p class="text-sm text-gray-400">${art.category.name}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        return `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-red-400">Article not found</h2>
                <p class="text-gray-400 mt-2">The article you're looking for doesn't exist.</p>
                <button onclick="window.router.navigate('/wiki')" class="mt-4 px-4 py-2 bg-blue-600 rounded-lg">
                    Back to Wiki
                </button>
            </div>
        `;
    }
}