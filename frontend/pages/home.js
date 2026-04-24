import { getState } from '../state.js';
import { getArticles } from '../api.js';
import router from '../router.js';
import ArticleCard from '../components/articleCard.js';

export default async function HomePage() {
    const state = getState();
    const recentArticles = await getArticles({ sort: '-createdAt', limit: 5 });
    const popularArticles = await getArticles({ sort: '-views', limit: 5 });

    return `
        <div class="space-y-12">
            <div class="text-center space-y-4">
                <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Knowledge Base Platform
                </h1>
                <p class="text-xl text-gray-300 max-w-2xl mx-auto">
                    Your comprehensive knowledge base for organized information, easy access, and collaborative learning.
                </p>
                <div class="flex gap-4 justify-center">
                    <button onclick="window.router.navigate('/wiki')" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                        Browse Knowledge Base →
                    </button>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 class="text-2xl font-bold mb-4">📚 Categories</h2>
                    <div class="space-y-2">
                        ${state.categories.map(cat => `
                            <div class="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition cursor-pointer"
                                 onclick="window.router.navigate('/wiki?category=${cat._id}')">
                                <span class="font-semibold">${cat.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <h2 class="text-2xl font-bold mb-4">🏷️ Popular Tags</h2>
                    <div class="flex flex-wrap gap-2">
                        ${state.tags.map(tag => `
                            <span class="px-3 py-1 bg-gray-800 rounded-full text-sm hover:bg-gray-700 cursor-pointer transition"
                                  onclick="window.router.navigate('/wiki?tags=${tag._id}')">
                                ${tag.name}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 class="text-2xl font-bold mb-4">🆕 Recent Updates</h2>
                    <div class="space-y-4">
                        ${recentArticles.map(article => ArticleCard(article)).join('')}
                    </div>
                </div>

                <div>
                    <h2 class="text-2xl font-bold mb-4">🔥 Popular Articles</h2>
                    <div class="space-y-4">
                        ${popularArticles.map(article => ArticleCard(article)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}