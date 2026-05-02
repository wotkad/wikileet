import { PAGINATION, UPLOAD } from '../../constants.js';
import { getArticles, deleteArticle } from '../../api.js';
import { showConfirmDialog } from '../../components/Dialog.js';
import { escapeHtml, formatDate, getStatusText, getStatusColor, getStatusIcon, calculateReadTime, getArticlesDeclension, getMinutesDeclension, getViewsDeclension } from '../../utils/utils.js';
import { renderPagination, attachPaginationEvents } from '../../components/Pagination.js';
import '../../components/Toast.js';

let currentPage = 1;
let currentStatusFilter = 'all';

function onPageChange(page) {
    const params = new URLSearchParams();
    params.set('page', page);
    if (currentStatusFilter !== 'all') {
        params.set('status', currentStatusFilter);
    }
    window.router.navigate(`/admin/articles?${params.toString()}`);
}

export default async function ArticlesListPage() {
    const urlParams = new URLSearchParams(window.location.search);
    
    currentPage = parseInt(urlParams.get('page')) || 1;
    currentStatusFilter = urlParams.get('status') || 'all';
    
    const params = { page: currentPage, limit: PAGINATION.ADMIN_ARTICLES_LIMIT };
    if (currentStatusFilter !== 'all') {
        params.status = currentStatusFilter;
    }
    
    const currentData = await getArticles(params);
    
    return `
        <div class="mx-auto">
            <div class="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-bold">Редактировать записи</h1>
                    <p class="text-gray-400 mt-1">${getArticlesDeclension(currentData.total)}</p>
                </div>
                <div class="flex gap-3">
                    <select id="status-filter" class="px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>Все записи</option>
                        <option value="published" ${currentStatusFilter === 'published' ? 'selected' : ''}>Опубликованные</option>
                        <option value="draft" ${currentStatusFilter === 'draft' ? 'selected' : ''}>Черновики</option>
                    </select>
                    <a href="/admin/articles/new" 
                       class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition">
                        + Создать запись
                    </a>
                </div>
            </div>
            
            <div class="grid grid-cols-1 gap-4">
                ${renderArticlesList(currentData.articles)}
            </div>
            
            ${renderPagination(currentPage, currentData.totalPages)}
        </div>
    `;
}

function renderArticlesList(articles) {
    if (!articles || articles.length === 0) {
        return '<div class="text-gray-400 text-center py-8">Нет записей</div>';
    }

    return articles.map(article => {
        const author = article.author || {};
        const authorAvatar = author.avatar ? `/api/profile/avatar/${author.avatar}` : UPLOAD.DEFAULT_AVATAR;
        const authorName = author.name || author.email || 'Нет автора';
        const authorSlug = author.slug;
        const hasValidAuthor = authorSlug && authorName !== 'Нет автора';

        const readTime = article.readTime || calculateReadTime(article.content);

        const readTimeText = getMinutesDeclension(readTime);
        const viewsText = getViewsDeclension(article.views);
        
        return `
            <div class="bg-gray-800 rounded-lg p-4" data-article-id="${article._id}" data-article-title="${escapeHtml(article.title)}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-lg font-semibold">${escapeHtml(article.title)}</h3>
                            ${renderStatusBadge(article.status)}
                        </div>
                        <p class="text-gray-400 text-sm mb-3">${escapeHtml(article.description || 'No description')}</p>
                        <div class="flex flex-wrap items-center gap-2 text-xs">
                            <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded">${escapeHtml(article.category?.name || 'Без категории')}</span>
                            <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">👁️ ${viewsText}</span>
                            <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">⏱️ ${readTimeText}</span>
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
                            ${article.publishedAt ? `<span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📢 ${formatDate(article.publishedAt)}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex gap-2 ml-4">
                        <a href="/admin/articles/${article.slug}" 
                           class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition">
                            Редактировать
                        </a>
                        <button data-slug="${article.slug}" data-title="${escapeHtml(article.title)}" 
                                class="delete-btn px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition">
                            Удалить
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderStatusBadge(status) {
    return `<span class="px-2 py-0.5 ${getStatusColor(status)} rounded-full text-xs font-medium">
        ${getStatusIcon(status)} ${getStatusText(status)}
    </span>`;
}

async function handleDelete(slug, title) {
    const confirmed = await showConfirmDialog(
        `Удалить "${title}"?`,
        'Это действите нельзя отменить!',
        'Удалить',
        'Отмена'
    );
    
    if (confirmed) {
        try {
            await deleteArticle(slug);
            window.toast?.success(`Article "${title}" deleted successfully`);
            // Перезагружаем страницу после удаления
            window.router.navigate(`/admin/articles?page=${currentPage}&status=${currentStatusFilter}`);
        } catch (error) {
            console.error('Error deleting article:', error);
            window.toast?.error('Failed to delete article: ' + error.message);
        }
    }
}

function attachDeleteEvents() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const slug = newBtn.dataset.slug;
            const title = newBtn.dataset.title;
            await handleDelete(slug, title);
        });
    });
}

function attachFilterEvents() {
    const filterSelect = document.getElementById('status-filter');
    if (filterSelect) {
        const currentValue = filterSelect.value;
        const newFilter = filterSelect.cloneNode(true);
        filterSelect.parentNode.replaceChild(newFilter, filterSelect);
        
        newFilter.value = currentValue;
        
        newFilter.addEventListener('change', (e) => {
            const status = e.target.value;
            const params = new URLSearchParams();
            params.set('page', '1');
            if (status !== 'all') {
                params.set('status', status);
            }
            window.router.navigate(`/admin/articles?${params.toString()}`);
        });
    }
}

window.initArticlesList = function() {
    attachDeleteEvents();
    attachFilterEvents();
    attachPaginationEvents(onPageChange);
};