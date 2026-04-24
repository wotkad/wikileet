import { getState } from '../state.js';
import { getArticles, getCategories, getTags } from '../api.js';
import router from '../router.js';
import ArticleCard from '../components/articleCard.js';

export default async function HomePage() {
    const state = getState();
    
    // Загружаем данные, если их нет в state
    let categories = state.categories;
    let tags = state.tags;
    
    if (!categories || categories.length === 0) {
        categories = await getCategories();
    }
    
    if (!tags || tags.length === 0) {
        tags = await getTags();
    }
    
    const recentArticles = await getArticles({ sort: '-createdAt', limit: 5 });
    const popularArticles = await getArticles({ sort: '-views', limit: 5 });
    
    // Проверяем, есть ли данные
    console.log('Categories:', categories);
    console.log('Tags:', tags);
    console.log('Recent Articles:', recentArticles);
    console.log('Popular Articles:', popularArticles);

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
                        ${categories && categories.length > 0 ? 
                            categories.map(cat => `
                                <div class="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer"
                                     onclick="window.router.navigate('/wiki?category=${cat._id}')">
                                    <span class="font-semibold">${cat.name}</span>
                                </div>
                            `).join('') : 
                            '<div class="text-gray-400 text-center py-4">No categories yet</div>'
                        }
                    </div>
                </div>

                <div>
                    <h2 class="text-2xl font-bold mb-4">🏷️ Popular Tags</h2>
                    <div class="flex flex-wrap gap-2">
                        ${tags && tags.length > 0 ? 
                            tags.map(tag => `
                                <span class="px-3 py-1 bg-gray-800 rounded-full text-sm hover:bg-gray-700 cursor-pointer transition"
                                      onclick="window.router.navigate('/wiki?tags=${tag._id}')">
                                    ${tag.name}
                                </span>
                            `).join('') : 
                            '<div class="text-gray-400 text-center py-4">No tags yet</div>'
                        }
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 class="text-2xl font-bold mb-4">🆕 Recent Updates</h2>
                    <div class="space-y-4">
                        ${recentArticles.articles && recentArticles.articles.length > 0 ? 
                            recentArticles.articles.map(article => ArticleCard(article)).join('') : 
                            '<div class="text-gray-400 text-center py-8">No articles yet</div>'
                        }
                    </div>
                </div>

                <div>
                    <h2 class="text-2xl font-bold mb-4">🔥 Popular Articles</h2>
                    <div class="space-y-4">
                        ${popularArticles.articles && popularArticles.articles.length > 0 ? 
                            popularArticles.articles.map(article => ArticleCard(article)).join('') : 
                            '<div class="text-gray-400 text-center py-8">No articles yet</div>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}