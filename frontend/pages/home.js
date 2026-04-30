import { escapeHtml } from '../utils/utils.js';
import { getState } from '../state.js';
import { getArticles, getCategories, getTags } from '../api.js';
import ArticleCard from '../components/ArticleCard.js';
import { PAGINATION } from '../constants.js';

export default async function HomePage() {
    const state = getState();
    
    let categories = state.categories;
    let tags = state.tags;
    
    if (!categories || categories.length === 0) {
        categories = await getCategories();
    }
    
    if (!tags || tags.length === 0) {
        tags = await getTags();
    }
    
    const recentArticles = await getArticles({ 
        sort: '-createdAt', 
        limit: PAGINATION.HOME_RECENT_LIMIT 
    });
    const popularArticles = await getArticles({ 
        sort: '-views', 
        limit: PAGINATION.HOME_POPULAR_LIMIT 
    });

    return `
        <div class="mx-auto space-y-8">
            <div class="text-center space-y-4">
                <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    База знаний
                </h1>
                <p class="text-gray-300 max-w-2xl mx-auto">
                    Всеобъемлющая база знаний для систематизированной информации, легкого доступа и совместного обучения.
                </p>
                <div class="flex gap-4 justify-center">
                    <a href="/wiki" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition inline-block">
                        Все записи →
                    </a>
                </div>
            </div>

            <div>
                <h2 class="text-2xl font-bold mb-4">📚 Разделы</h2>
                <div class="flex flex-wrap gap-2">
                    ${categories && categories.length > 0 ? 
                        categories.map(cat => `
                            <a href="/wiki?category=${cat.slug}" class="block bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition">
                                <span class="font-semibold">${escapeHtml(cat.name)}</span>
                            </a>
                        `).join('') : 
                        '<div class="text-gray-400 text-center py-4">Нет категорий</div>'
                    }
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <h2 class="text-2xl font-bold mb-4">🆕 Последние записи</h2>
                    <div class="space-y-4">
                        ${recentArticles.articles && recentArticles.articles.length > 0 ? 
                            recentArticles.articles.map(article => ArticleCard(article)).join('') : 
                            '<div class="text-gray-400 text-center py-8">Нет записей</div>'
                        }
                    </div>
                </div>

                <div>
                    <h2 class="text-2xl font-bold mb-4">🔥 Популярные записи</h2>
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