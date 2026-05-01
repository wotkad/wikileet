import { escapeHtml, calculateReadTime, formatDate } from '../utils/utils.js';
import { getArticle } from '../api.js';
import ArticleCard from '../components/ArticleCard.js';
import FavoriteButton from '../components/FavoriteButton.js';
import { PAGINATION, UPLOAD } from '../constants.js';
import { getState } from '../state.js';
import { loadFavorites } from '../components/FavoriteButton.js';

// Функция для копирования ссылки в буфер обмена
async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        window.toast?.success(message);
    } catch (err) {
        console.error('Ошибка копирования:', err);
        window.toast?.error('Не удалось скопировать ссылку');
    }
}

let readingProgressInterval = null;

// Функция для парсинга Markdown в HTML
function parseMarkdown(content) {
    if (!content) return '';
    if (typeof marked !== 'undefined') {
        return marked.parse(content);
    }
    return escapeHtml(content).replace(/\n/g, '<br>');
}

// Функция для обновления прогресса чтения
function updateReadingProgress() {
    const proseElement = document.querySelector('.prose');
    const progressBar = document.getElementById('reading-progress-bar');
    const progressContainer = document.getElementById('reading-progress-container');
    
    if (!proseElement || !progressBar) return;
    
    const scrollContainer = document.querySelector('.main-content-area');
    if (!scrollContainer) return;
    
    const proseHeight = proseElement.offsetHeight;
    const scrollTop = scrollContainer.scrollTop;
    const containerHeight = scrollContainer.clientHeight;
    const maxScroll = proseHeight - containerHeight;
    
    if (maxScroll <= 0) {
        progressBar.style.width = '0%';
        return;
    }
    
    const percent = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
    progressBar.style.width = `${percent}%`;
    
    if (scrollTop > 100) {
        progressContainer.classList.remove('opacity-0', 'translate-y-full');
        progressContainer.classList.add('opacity-100', 'translate-y-0');
    } else {
        progressContainer.classList.remove('opacity-100', 'translate-y-0');
        progressContainer.classList.add('opacity-0', 'translate-y-full');
    }
}

function initReadingProgress() {
    const scrollContainer = document.querySelector('.main-content-area');
    if (!scrollContainer) return;
    
    if (readingProgressInterval) {
        clearInterval(readingProgressInterval);
    }
    
    scrollContainer.addEventListener('scroll', updateReadingProgress);
    window.addEventListener('resize', updateReadingProgress);
    
    setTimeout(updateReadingProgress, 100);
}

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
        
        if (state.currentUser) {
            await loadFavorites();
        }
        
        const readTime = article.readTime || calculateReadTime(article.content);
        const author = article.author || {};
        const authorAvatar = author.avatar ? `/api/profile/avatar/${author.avatar}` : UPLOAD.DEFAULT_AVATAR;
        const isLoggedIn = !!state.currentUser;
        
        // Парсим Markdown в HTML
        const parsedContent = parseMarkdown(article.content);
        
        const similarArticles = (similar || []).slice(0, PAGINATION.SIMILAR_ARTICLES_LIMIT);
        
        setTimeout(initReadingProgress, 100);
        
        const articleUrl = `${window.location.origin}/wiki/${article.slug}`;
        
        return `
            <article class="mx-auto relative">
                <!-- Прогресс-бар чтения -->
                <div id="reading-progress-container" class="fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 transform translate-y-full opacity-0">
                    <div class="h-1 bg-gray-700 w-full">
                        <div id="reading-progress-bar" class="h-full bg-blue-500 transition-all duration-200" style="width: 0%;"></div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center mb-4">
                    <a href="/wiki" class="inline-block text-blue-400 hover:text-blue-300 transition">
                        ← Назад к записям
                    </a>
                    <div class="flex gap-2">
                        <button id="copyArticleBtn" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm flex items-center gap-2" data-url="${articleUrl}" data-title="${escapeHtml(article.title)}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                            Копировать ссылку
                        </button>
                        ${isLoggedIn ? FavoriteButton(article._id) : ''}
                    </div>
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
                        ${parsedContent}
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

// Обработчик кнопки "Копировать ссылку" на странице статьи
setTimeout(() => {
    const copyBtn = document.getElementById('copyArticleBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = copyBtn.dataset.url;
            const title = copyBtn.dataset.title;
            if (url) {
                await copyToClipboard(url, `Ссылка на "${title}" скопирована!`);
            }
        });
    }
}, 100);