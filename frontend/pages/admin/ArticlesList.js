import { getArticles, deleteArticle } from '../../api.js';
import { showConfirmDialog } from '../../components/Dialog.js';
import { escapeHtml, formatDate, getStatusText, getStatusColor, getStatusIcon } from '../../utils/utils.js';
import '../../components/Toast.js';

let currentPage = 1;
let currentData = null;
let currentStatusFilter = 'all';

export default async function ArticlesListPage() {
    const params = { page: currentPage, limit: 20 };
    
    if (currentStatusFilter !== 'all') {
        params.status = currentStatusFilter;
    } else {
        params.status = 'all';
    }
    
    currentData = await getArticles(params);
    
    return `
        <div class="max-w-6xl mx-auto">
            <div class="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-bold">Manage Articles</h1>
                    <p class="text-gray-400 mt-1" id="total-count">${currentData.total || 0} total articles</p>
                </div>
                <div class="flex gap-3">
                    <select id="status-filter" class="px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>All articles</option>
                        <option value="published" ${currentStatusFilter === 'published' ? 'selected' : ''}>Published</option>
                        <option value="draft" ${currentStatusFilter === 'draft' ? 'selected' : ''}>Drafts</option>
                    </select>
                    <a href="/admin/articles/new" 
                       class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition">
                        + Create New Article
                    </a>
                </div>
            </div>
            
            <div class="grid grid-cols-1 gap-4" id="articles-list-container">
                ${renderArticlesList(currentData.articles)}
            </div>
            
            ${currentData.totalPages > 1 ? renderPagination(currentData) : ''}
        </div>
    `;
}

function renderArticlesList(articles) {
    if (!articles || articles.length === 0) {
        return '<div class="text-gray-400 text-center py-8">No articles yet. Create your first article!</div>';
    }
    
    return articles.map(article => `
        <div class="bg-gray-800 rounded-lg p-4" data-article-id="${article._id}" data-article-title="${escapeHtml(article.title)}">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-semibold">${escapeHtml(article.title)}</h3>
                        ${renderStatusBadge(article.status)}
                    </div>
                    <p class="text-gray-400 text-sm mb-3">${escapeHtml(article.description || 'No description')}</p>
                    <div class="flex flex-wrap gap-2 text-xs">
                        <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded">${escapeHtml(article.category?.name || 'Uncategorized')}</span>
                        <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">👁️ ${article.views || 0}</span>
                        <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">⏱️ ${article.readTime || 1} min read</span>
                        <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📅 ${formatDate(article.createdAt)}</span>
                        ${article.publishedAt ? `<span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📢 ${formatDate(article.publishedAt)}</span>` : ''}
                    </div>
                </div>
                <div class="flex gap-2 ml-4">
                    <a href="/admin/articles/${article.slug}" 
                       class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition">
                        Edit
                    </a>
                    <button data-id="${article._id}" data-slug="${article.slug}" data-title="${escapeHtml(article.title)}" 
                            class="delete-btn px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStatusBadge(status) {
    return `<span class="px-2 py-0.5 ${getStatusColor(status)} rounded-full text-xs font-medium">
        ${getStatusIcon(status)} ${getStatusText(status)}
    </span>`;
}

function renderPagination(data) {
    return `
        <div class="flex justify-center gap-2 mt-8">
            ${Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => i + 1).map(page => `
                <button class="page-btn px-3 py-1 rounded ${page === currentPage ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}"
                        data-page="${page}">
                    ${page}
                </button>
            `).join('')}
        </div>
    `;
}

async function refreshArticlesList() {
    try {
        const params = { page: currentPage, limit: 20 };
        
        if (currentStatusFilter !== 'all') {
            params.status = currentStatusFilter;
        } else {
            params.status = 'all';
        }
        
        currentData = await getArticles(params);
        
        const container = document.getElementById('articles-list-container');
        const totalCountSpan = document.getElementById('total-count');
        
        if (container) {
            container.innerHTML = renderArticlesList(currentData.articles);
        }
        
        if (totalCountSpan) {
            totalCountSpan.textContent = `${currentData.total || 0} total articles`;
        }
        
        updatePagination();
        
        attachDeleteEvents();
        attachPaginationEvents();
    } catch (error) {
        console.error('Error refreshing articles list:', error);
        window.toast?.error('Failed to refresh articles list');
    }
}

function updatePagination() {
    const existingPagination = document.querySelector('.flex.justify-center.gap-2.mt-8');
    if (existingPagination && currentData.totalPages > 1) {
        existingPagination.innerHTML = renderPagination(currentData).replace('flex justify-center gap-2 mt-8', '');
        attachPaginationEvents();
    } else if (existingPagination && currentData.totalPages <= 1) {
        existingPagination.remove();
    } else if (!existingPagination && currentData.totalPages > 1) {
        const container = document.querySelector('.max-w-6xl.mx-auto');
        if (container) {
            container.insertAdjacentHTML('beforeend', renderPagination(currentData));
            attachPaginationEvents();
        }
    }
}

async function attachDeleteEvents() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const articleTitle = newBtn.dataset.title;
            
            const confirmed = await showConfirmDialog(
                `Delete "${articleTitle}"?`,
                'This action cannot be undone.',
                'Delete',
                'Cancel'
            );
            
            if (confirmed) {
                try {
                    const articleSlug = newBtn.dataset.slug;
                    newBtn.textContent = 'Deleting...';
                    newBtn.disabled = true;
                    newBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    
                    await deleteArticle(articleSlug);
                    
                    window.toast?.success(`Article "${articleTitle}" deleted successfully`);
                    await refreshArticlesList();
                } catch (error) {
                    console.error('Error deleting article:', error);
                    window.toast?.error('Failed to delete article: ' + error.message);
                    
                    newBtn.textContent = 'Delete';
                    newBtn.disabled = false;
                    newBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    });
}

async function attachPaginationEvents() {
    document.querySelectorAll('.page-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async () => {
            currentPage = parseInt(newBtn.dataset.page);
            await refreshArticlesList();
        });
    });
}

async function attachFilterEvents() {
    const filterSelect = document.getElementById('status-filter');
    if (filterSelect) {
        const currentValue = filterSelect.value;
        const newFilter = filterSelect.cloneNode(true);
        filterSelect.parentNode.replaceChild(newFilter, filterSelect);
        
        newFilter.value = currentValue;
        
        newFilter.addEventListener('change', async (e) => {
            const newValue = e.target.value;
            currentStatusFilter = newValue;
            currentPage = 1;
            await refreshArticlesList();
        });
    }
}

window.initArticlesList = function() {
    attachDeleteEvents();
    attachPaginationEvents();
    attachFilterEvents();
};