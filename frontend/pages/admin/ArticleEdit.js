import { getArticle, createArticle, updateArticle, getCategories, getTags, getUsers } from '../../api.js';
import { showConfirmDialog } from '../../components/Dialog.js';
import { escapeHtml, generateSlug, isValidSlug, formatDate } from '../../utils/utils.js';
import '../../components/Toast.js';

let simplemde = null;

export default async function ArticleEditPage(params) {
    const isEdit = params.slug && params.slug !== 'new';
    const slug = isEdit ? params.slug : null;
    
    let article = null;
    let categories = [];
    let tags = [];
    let users = [];
    
    try {
        [categories, tags, users] = await Promise.all([
            getCategories(),
            getTags(),
            getUsers()
        ]);
        
        if (isEdit) {
            const data = await getArticle(slug);
            article = data.article;
            if (!article) {
                return `
                    <div class="text-center py-12">
                        <h2 class="text-2xl font-bold text-red-400">Запись не найдена</h2>
                        <a href="/admin/articles" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Вернуться в админ панель</a>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    
    const currentStatus = article?.status || 'draft';
    const currentAuthor = article?.author?._id || '';
    const currentPublishDate = article?.publishedAt ? formatDate(article.publishedAt) : '';
    
    return `
        <div class="mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-bold">${isEdit ? 'Редактировать запись "' + article.title + '"' : 'Создать новую запись'}</h1>
                <p class="text-gray-400 mt-1">Заполните форму ниже чтобы ${isEdit ? 'обновить' : 'создать'} запись</p>
            </div>
            
            <form id="articleForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium mb-2">Заголовок *</label>
                        <input type="text" 
                               id="title" 
                               required
                               value="${escapeHtml(article?.title || '')}"
                               class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Ссылка</label>
                        <input type="text" 
                               id="slug" 
                               placeholder="Leave empty to auto-generate from title"
                               pattern="[a-z0-9-]+"
                               title="Only lowercase letters, numbers, and hyphens"
                               value="${escapeHtml(article?.slug || '')}"
                               class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">Оставьте поле пустым, чтобы заголовок генерировался автоматически из заголовка</p>
                        ${!isEdit ? '<p class="text-xs text-green-500 mt-1">✓ Автоматически генерируется из заголовка, если поле оставлено пустым</p>' : '<p class="text-xs text-yellow-500 mt-1">⚠️ Изменение параметра slug приведет к изменению URL статьи.</p>'}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Короткое описание *</label>
                    <textarea id="description" 
                              rows="3"
                              required
                              class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${escapeHtml(article?.description || '')}</textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Контент *</label>
                    <textarea id="content" 
                              rows="15"
                              required
                              class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${escapeHtml(article?.content || '')}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium mb-2">Категория *</label>
                        <select id="category" required class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select a category</option>
                            ${categories.map(cat => `
                                <option value="${cat._id}" ${article?.category?._id === cat._id ? 'selected' : ''}>
                                    ${escapeHtml(cat.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Автор</label>
                        <select id="author" class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Выбрать автора (по умолчанию: текущий пользователь)</option>
                            ${users.map(user => `
                                <option value="${user._id}" ${currentAuthor === user._id ? 'selected' : ''}>
                                    ${escapeHtml(user.name)} (${escapeHtml(user.email)})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Теги (можно выбрать несколько)</label>
                    <div class="flex flex-wrap gap-2 p-3 bg-gray-800 rounded-lg max-h-32 overflow-y-auto" id="tags-container">
                        ${tags.map(tag => `
                            <label class="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-full cursor-pointer hover:bg-gray-600 transition">
                                <input type="checkbox" value="${tag._id}" 
                                       ${article?.tags?.some(t => t._id === tag._id) ? 'checked' : ''}
                                       class="tag-checkbox">
                                <span class="text-sm">${escapeHtml(tag.name)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium mb-2">Статус</label>
                        <select id="status" class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="draft" ${currentStatus === 'draft' ? 'selected' : ''}>📝 Черновик</option>
                            <option value="published" ${currentStatus === 'published' ? 'selected' : ''}>🚀 Опубликовать</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Дата</label>
                        <input type="datetime-local" 
                               id="publishDate" 
                               value="${currentPublishDate}"
                               class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">Оставьте как есть для текущей даты/времени</p>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                        💾 Сохранить
                    </button>
                    <a href="/admin/articles" class="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition text-center">
                        Отмена
                    </a>
                </div>
            </form>
        </div>
    `;
}

function initMarkdownEditor(isNew = false) {
    const textarea = document.getElementById('content');
    if (!textarea) return;
    
    if (window.simplemde && window.simplemdeInitialized) {
        try {
            window.simplemde.toTextArea();
            window.simplemde = null;
            window.simplemdeInitialized = false;
        } catch(e) {}
    }
    
    if (isNew) {
        localStorage.removeItem('smde_article_content');
    }
    
    if (!document.querySelector('link[href*="simplemde"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css';
        document.head.appendChild(link);
    }
    
    if (typeof window.SimpleMDE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js';
        script.onload = () => {
            createSimpleMDE(textarea, isNew);
        };
        document.head.appendChild(script);
    } else {
        createSimpleMDE(textarea, isNew);
    }
}

function createSimpleMDE(textarea, isNew = false) {
    setTimeout(() => {
        try {
            if (isNew && (!textarea.value || textarea.value.trim() === '')) {
                localStorage.removeItem('smde_article_content');
            }
            
            window.simplemde = new window.SimpleMDE({
                element: textarea,
                spellChecker: false,
                autosave: {
                    enabled: true,
                    uniqueId: "article_content",
                    delay: 1000,
                },
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "code", "unordered-list", "ordered-list", "|",
                    "link", "image", "table", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide"
                ],
                placeholder: "Write your article content here using Markdown...",
                status: ["lines", "words", "cursor"],
            });
            
            if (isNew && window.simplemde.value() === '') {
                window.simplemde.value('');
            }
            
            window.simplemdeInitialized = true;
        } catch(e) {
            console.error('Error initializing SimpleMDE:', e);
        }
    }, 100);
}

window.initArticleEdit = async function(slug) {
    const isEdit = slug && slug !== 'new';
    const isNew = !isEdit;
    const oldSlug = isEdit ? slug : null;
    
    setTimeout(() => {
        initMarkdownEditor(isNew);
    }, 100);
    
    const slugInput = document.getElementById('slug');
    if (slugInput) {
        slugInput.addEventListener('input', function() {
            let value = this.value.toLowerCase();
            value = value.replace(/[^a-z0-9-]/g, '-');
            value = value.replace(/--+/g, '-');
            value = value.replace(/^-+|-+$/g, '');
            this.value = value;
        });
    }
    
    const form = document.getElementById('articleForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            let content = document.getElementById('content').value;
            if (window.simplemde && window.simplemdeInitialized) {
                content = window.simplemde.value();
            }
            
            const title = document.getElementById('title').value;
            let formSlug = document.getElementById('slug').value;
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const author = document.getElementById('author')?.value || null;
            const status = document.getElementById('status').value;
            let publishDate = document.getElementById('publishDate').value;
            
            const tagCheckboxes = document.querySelectorAll('.tag-checkbox:checked');
            const tags = Array.from(tagCheckboxes).map(cb => cb.value);
            
            if (!title) {
                window.toast?.warning('Please enter a title');
                document.getElementById('title').focus();
                return;
            }
            
            if (!description) {
                window.toast?.warning('Please enter a description');
                document.getElementById('description').focus();
                return;
            }
            
            if (!category) {
                window.toast?.warning('Please select a category');
                document.getElementById('category').focus();
                return;
            }
            
            if (!content) {
                window.toast?.warning('Please enter content');
                if (window.simplemde) {
                    window.simplemde.codemirror.focus();
                }
                return;
            }
            
            if (!formSlug) {
                formSlug = generateSlug(title);
                if (!formSlug) {
                    window.toast?.warning('Please enter a title');
                    return;
                }
            }
            
            if (!isValidSlug(formSlug)) {
                window.toast?.error('Slug can only contain lowercase letters, numbers, and hyphens');
                document.getElementById('slug').focus();
                return;
            }
            
            let publishedAt = null;
            if (publishDate) {
                publishedAt = formatDate(publishDate);
            } else if (status === 'published') {
                publishedAt = formatDate;
            }
            
            if (isEdit && oldSlug && formSlug !== oldSlug) {
                const confirmed = await showConfirmDialog(
                    'Change Slug?',
                    `You are changing the slug from "${oldSlug}" to "${formSlug}".\n\nThis will break any existing links to this article. Are you sure?`,
                    'Continue',
                    'Cancel'
                );
                if (!confirmed) return;
            }
            
            try {
                const articleData = { 
                    title, 
                    slug: formSlug, 
                    description, 
                    category, 
                    tags, 
                    content, 
                    status,
                    author,
                    publishedAt
                };
                let result;
                
                if (isEdit) {
                    result = await updateArticle(oldSlug, articleData);
                    window.toast?.success(`Article "${title}" updated successfully`);
                } else {
                    result = await createArticle(articleData);
                    window.toast?.success(`Article "${title}" created successfully`);
                }
                
                window.router.navigate(`/admin/articles`);
            } catch (error) {
                console.error('Error saving article:', error);
                window.toast?.error('Error saving article: ' + error.message);
            }
        };
    }
};