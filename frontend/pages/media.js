import { escapeHtml, formatDate } from '../utils/utils.js';
import { showConfirmDialog } from '../components/Dialog.js';
import { renderPagination } from '../components/Pagination.js';
import { PAGINATION } from '../constants.js';

let currentPage = 1;
let currentType = 'all';
let currentMedia = [];
let totalPages = 1;
let isLoading = false;

function onPageChange(page) {
    if (isLoading) return;
    currentPage = page;
    loadMedia();
}

function onTypeChange(type) {
    if (isLoading) return;
    currentType = type;
    currentPage = 1;
    loadMedia();
}

async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        window.toast?.success(message);
    } catch (err) {
        console.error('Error copying:', err);
        window.toast?.error('Не удалось скопировать ссылку');
    }
}

async function loadMedia() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const url = `/api/media?page=${currentPage}&limit=${PAGINATION.MEDIA_LIMIT || 20}&type=${currentType}`;
        const response = await fetch(url, { credentials: 'include' });
        
        if (!response.ok) throw new Error('Failed to load media');
        
        const data = await response.json();
        currentMedia = data.media || [];
        totalPages = data.totalPages || 1;
        
        renderMediaGrid();
        updatePagination();
    } catch (error) {
        console.error('Error loading media:', error);
        window.toast?.error('Ошибка загрузки медиа');
    } finally {
        isLoading = false;
    }
}

function updatePagination() {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;
    
    const newPagination = renderPagination(currentPage, totalPages);
    paginationContainer.innerHTML = newPagination;
    
    const pageButtons = paginationContainer.querySelectorAll('.page-btn');
    const prevBtn = paginationContainer.querySelector('.page-prev');
    const nextBtn = paginationContainer.querySelector('.page-next');
    
    pageButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            if (!isLoading) {
                currentPage = parseInt(newBtn.dataset.page);
                loadMedia();
            }
        });
    });
    
    if (prevBtn && !prevBtn.disabled) {
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        newPrevBtn.addEventListener('click', () => {
            if (!isLoading) {
                currentPage = parseInt(newPrevBtn.dataset.page);
                loadMedia();
            }
        });
    }
    
    if (nextBtn && !nextBtn.disabled) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', () => {
            if (!isLoading) {
                currentPage = parseInt(newNextBtn.dataset.page);
                loadMedia();
            }
        });
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        window.toast?.success('Файл успешно загружен');
        loadMedia();
    } catch (error) {
        console.error('Upload error:', error);
        window.toast?.error('Ошибка загрузки файла');
    }
}

async function deleteMedia(id, filename) {
    const confirmed = await showConfirmDialog(
        `Удалить файл?`,
        `Вы уверены, что хотите удалить "${filename}"?`,
        'Удалить',
        'Отмена'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/api/media/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Delete failed');
        
        window.toast?.success('Файл удалён');
        loadMedia();
    } catch (error) {
        console.error('Delete error:', error);
        window.toast?.error('Ошибка удаления файла');
    }
}

function renderMediaGrid() {
    const container = document.getElementById('media-grid');
    if (!container) return;
    
    if (currentMedia.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                Нет загруженных файлов
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentMedia.map(media => {
        const fullUrl = `${window.location.origin}${media.url}`;
        const isImage = media.type === 'image';
        const tooltipId = `tooltip-${media._id}`;
        
        return `
            <div class="bg-gray-800 rounded-lg overflow-hidden group relative">
                <div class="aspect-video bg-gray-900 relative">
                    ${isImage ? `
                        <img src="${media.url}?t=${Date.now()}" 
                             alt="${escapeHtml(media.originalName)}"
                             class="w-full h-full object-cover"
                             loading="lazy">
                    ` : `
                        <video class="w-full h-full object-cover" muted>
                            <source src="${media.url}">
                        </video>
                    `}
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                        <button class="info-btn p-2 bg-green-600 rounded-full hover:bg-green-700 transition transform scale-0 group-hover:scale-100"
                                data-media-id="${media._id}"
                                data-tooltip-id="${tooltipId}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </button>
                        <button class="copy-btn p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition transform scale-0 group-hover:scale-100"
                                data-url="${fullUrl}"
                                data-title="${escapeHtml(media.originalName)}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                        </button>
                        <button class="delete-btn p-2 bg-red-600 rounded-full hover:bg-red-700 transition transform scale-0 group-hover:scale-100"
                                data-id="${media._id}"
                                data-filename="${escapeHtml(media.originalName)}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="p-3">
                    <div class="text-sm font-medium truncate" title="${escapeHtml(media.originalName)}">
                        ${escapeHtml(media.originalName)}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        ${formatFileSize(media.size)} • ${formatDate(media.createdAt)}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${escapeHtml(media.uploadedBy?.name || 'Unknown')}
                    </div>
                </div>
                
                <!-- Tooltip для отображения статей -->
                <div id="${tooltipId}" 
                     class="articles-tooltip hidden fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-sm w-80"
                     style="display: none;">
                </div>
            </div>
        `;
    }).join('');
    
    attachMediaEvents();
}

function attachMediaEvents() {
    // Копирование
    document.querySelectorAll('.copy-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = newBtn.dataset.url;
            const title = newBtn.dataset.title;
            await copyToClipboard(url, `Ссылка на "${title}" скопирована!`);
        });
    });
    
    // Удаление
    document.querySelectorAll('.delete-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = newBtn.dataset.id;
            const filename = newBtn.dataset.filename;
            await deleteMedia(id, filename);
        });
    });
    
    // Информация о статьях (при наведении)
    document.querySelectorAll('.info-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        let hideTimeout;
        let isHoveringTooltip = false;
        const tooltipId = newBtn.dataset.tooltipId;
        const tooltip = document.getElementById(tooltipId);
        
        if (!tooltip) return;
        
        function showTooltip() {
            clearTimeout(hideTimeout);
            const rect = newBtn.getBoundingClientRect();
            tooltip.style.display = 'block';
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${rect.top - 20}px`;
            
            // Проверяем, не выходит ли за пределы экрана
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
            }
            if (tooltipRect.bottom > window.innerHeight) {
                tooltip.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
            }
        }
        
        function hideTooltip() {
            if (!isHoveringTooltip) {
                hideTimeout = setTimeout(() => {
                    tooltip.style.display = 'none';
                }, 300);
            }
        }
        
        // Показываем тултип при наведении на кнопку
        newBtn.addEventListener('mouseenter', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(hideTimeout);
            
            // Загружаем данные, если тултип пустой
            if (tooltip.innerHTML.trim() === '' || tooltip.children.length === 0) {
                tooltip.innerHTML = '<div class="text-center py-4 text-gray-400">Загрузка...</div>';
                await loadMediaArticles(newBtn.dataset.mediaId, tooltipId);
            }
            
            showTooltip();
        });
        
        newBtn.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        // Обработка наведения на тултип
        tooltip.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            isHoveringTooltip = true;
        });
        
        tooltip.addEventListener('mouseleave', () => {
            isHoveringTooltip = false;
            hideTooltip();
        });
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default async function MediaPage() {
    return `
        <div class="mx-auto">
            <div class="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-bold">Медиатека</h1>
                    <p class="text-gray-400 mt-1">Управление изображениями и видео</p>
                </div>
                <div class="flex gap-3">
                    <select id="type-filter" class="px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">Все файлы</option>
                        <option value="image">Изображения</option>
                        <option value="video">Видео</option>
                    </select>
                    <label class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition cursor-pointer">
                        + Загрузить файл
                        <input type="file" id="file-input" accept="image/*,video/*" class="hidden">
                    </label>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" id="media-grid">
                <div class="col-span-full text-center py-12 text-gray-400">
                    Загрузка...
                </div>
            </div>
            
            <div class="pagination-container mt-8">
                ${renderPagination(currentPage, totalPages)}
            </div>
        </div>
    `;
}

window.initMediaPage = function() {
    console.log('Initializing media page');
    
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        const newTypeFilter = typeFilter.cloneNode(true);
        typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);
        newTypeFilter.addEventListener('change', (e) => {
            onTypeChange(e.target.value);
        });
    }
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        newFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadFile(file);
                newFileInput.value = '';
            }
        });
    }
    
    loadMedia();
};

async function loadMediaArticles(mediaId, elementId) {
    try {
        const response = await fetch(`/api/media/${mediaId}/articles`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load articles');
        
        const data = await response.json();
        renderArticlesTooltip(data.articles, elementId);
    } catch (error) {
        console.error('Error loading media articles:', error);
        const tooltip = document.getElementById(elementId);
        if (tooltip) {
            tooltip.innerHTML = `
                <div class="text-red-400 text-sm p-2">
                    Ошибка загрузки списка статей
                </div>
            `;
        }
    }
}

function renderArticlesTooltip(articles, elementId) {
    const tooltip = document.getElementById(elementId);
    if (!tooltip) return;
    
    if (!articles || articles.length === 0) {
        tooltip.innerHTML = `
            <div class="text-gray-400 text-sm p-2">
                Файл не используется ни в одной статье
            </div>
        `;
        return;
    }
    
    tooltip.innerHTML = `
        <div class="p-2 max-h-64 overflow-y-auto">
            <div class="text-xs text-gray-400 mb-2 pb-2 border-b border-gray-700">
                Используется в:
            </div>
            <div class="space-y-1">
                ${articles.map(article => `
                    <a href="/wiki/${article.slug}" 
                       class="block text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-700 p-1 rounded transition"
                       target="_blank">
                        <div class="font-medium">${escapeHtml(article.title)}</div>
                        ${article.description ? `<div class="text-xs text-gray-500 truncate">${escapeHtml(article.description)}</div>` : ''}
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}