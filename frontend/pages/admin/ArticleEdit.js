import { getArticle, createArticle, updateArticle, getCategories, getTags } from '../../api.js';
import { showConfirmDialog, escapeHtml } from '../../components/Dialog.js';
import '../../components/Toast.js';

let simplemde = null;

export default async function ArticleEditPage(params) {
    const isEdit = params.slug && params.slug !== 'new';
    const slug = isEdit ? params.slug : null;
    
    let article = null;
    let categories = [];
    let tags = [];
    
    try {
        [categories, tags] = await Promise.all([
            getCategories(),
            getTags()
        ]);
        
        if (isEdit) {
            const data = await getArticle(slug);
            article = data.article;
            if (!article) {
                return `
                    <div class="text-center py-12">
                        <h2 class="text-2xl font-bold text-red-400">Article not found</h2>
                        <a href="/admin/articles" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Back to Admin</a>
                    </div>
                `;
            }
            console.log('Loaded article for edit:', article);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    
    return `
        <div class="max-w-6xl mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-bold">${isEdit ? 'Edit Article' : 'Create New Article'}</h1>
                <p class="text-gray-400 mt-1">Fill in the form below to ${isEdit ? 'update' : 'create'} an article</p>
                ${isEdit ? '<p class="text-yellow-400 text-sm mt-1">⚠️ Warning: Changing the slug will break existing links!</p>' : ''}
            </div>
            
            <form id="articleForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium mb-2">Title *</label>
                        <input type="text" 
                               id="title" 
                               required
                               value="${escapeHtml(article?.title || '')}"
                               class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Slug * (URL identifier)</label>
                        <input type="text" 
                               id="slug" 
                               required
                               placeholder="Leave empty to auto-generate from title"
                               pattern="[a-z0-9-]+"
                               title="Only lowercase letters, numbers, and hyphens"
                               value="${escapeHtml(article?.slug || '')}"
                               class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">Leave empty to auto-generate from title. Example: my-awesome-article (only lowercase letters, numbers, and hyphens)</p>
                        ${isEdit ? '<p class="text-xs text-yellow-500 mt-1">⚠️ Editing slug will change the article URL</p>' : '<p class="text-xs text-green-500 mt-1">✓ Auto-generated from title if left empty</p>'}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Short Description *</label>
                    <textarea id="description" 
                              rows="3"
                              required
                              class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${escapeHtml(article?.description || '')}</textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Content * (Markdown supported)</label>
                    <textarea id="content" 
                              rows="15"
                              class="w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${escapeHtml(article?.content || '')}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium mb-2">Category *</label>
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
                        <label class="block text-sm font-medium mb-2">Tags (select multiple)</label>
                        <div class="flex flex-wrap gap-2 p-3 bg-gray-800 rounded-lg" id="tags-container">
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
                </div>
                
                <div class="flex gap-4">
                    <button type="submit" 
                            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                        ${isEdit ? 'Update Article' : 'Create Article'}
                    </button>
                    <a href="/admin/articles" 
                       class="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition text-center">
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    `;
}

// Функция для генерации slug из заголовка
function generateSlug(title) {
    if (!title || title.trim() === '') {
        return '';
    }
    
    return title
        .toLowerCase()                           // Приводим к нижнему регистру
        .replace(/[^\w\s-]/g, '')               // Удаляем все спецсимволы (точки, запятые и т.д.)
        .replace(/\s+/g, '-')                    // Заменяем пробелы на тире
        .replace(/--+/g, '-')                    // Заменяем несколько тире подряд на одно
        .replace(/^-+|-+$/g, '');                // Удаляем тире в начале и конце
}

function initMarkdownEditor() {
    const textarea = document.getElementById('content');
    if (!textarea) return;
    
    if (window.simplemde && window.simplemdeInitialized) {
        try {
            window.simplemde.toTextArea();
            window.simplemde = null;
            window.simplemdeInitialized = false;
        } catch(e) {}
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
            createSimpleMDE(textarea);
        };
        document.head.appendChild(script);
    } else {
        createSimpleMDE(textarea);
    }
}

function createSimpleMDE(textarea) {
    setTimeout(() => {
        try {
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
            window.simplemdeInitialized = true;
            console.log('SimpleMDE initialized');
        } catch(e) {
            console.error('Error initializing SimpleMDE:', e);
        }
    }, 100);
}

window.initArticleEdit = async function(slug) {
    const isEdit = slug && slug !== 'new';
    const oldSlug = isEdit ? slug : null;
    
    console.log('Initializing article edit, isEdit:', isEdit, 'slug:', slug);
    
    setTimeout(() => {
        initMarkdownEditor();
    }, 100);
    
    // Валидация slug при ручном вводе (для всех статей)
    const slugInput = document.getElementById('slug');
    if (slugInput) {
        slugInput.addEventListener('input', function() {
            // Валидация: только буквы, цифры и тире
            let value = this.value.toLowerCase();
            value = value.replace(/[^a-z0-9-]/g, '-');
            value = value.replace(/--+/g, '-');
            value = value.replace(/^-+|-+$/g, '');
            this.value = value;
        });
    }
    
    // Обработка отправки формы
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
            
            const tagCheckboxes = document.querySelectorAll('.tag-checkbox:checked');
            const tags = Array.from(tagCheckboxes).map(cb => cb.value);
            
            // Если slug не указан, генерируем из title
            if (!formSlug) {
                formSlug = generateSlug(title);
                console.log('Auto-generated slug from title:', formSlug);
                
                if (!formSlug) {
                    alert('Please enter a title or provide a slug');
                    return;
                }
            }
            
            console.log('Form data:', { title, slug: formSlug, description, category, tags, contentLength: content?.length });
            
            if (!title || !formSlug || !description || !category || !content) {
                window.toast?.warning('Please fill in all required fields');
                return;
            }
            
            if (!/^[a-z0-9-]+$/.test(formSlug)) {
                window.toast?.error('Slug can only contain lowercase letters, numbers, and hyphens');
                return;
            }
            
            // Предупреждение при изменении slug у существующей статьи
            if (isEdit && oldSlug && formSlug !== oldSlug) {
                const confirmed = await showConfirmDialog(
                    'Change Slug?',
                    `You are changing the slug from "${oldSlug}" to "${formSlug}".\n\nThis will break any existing links to this article. Are you sure?`
                );
                if (!confirmed) {
                    return;
                }
            }
            
            try {
                const articleData = { title, slug: formSlug, description, category, tags, content };
                let result;
                
                if (isEdit) {
                    console.log('Updating article with old slug:', oldSlug, 'new slug:', formSlug);
                    result = await updateArticle(oldSlug, articleData);
                    console.log('Update result:', result);
                    window.toast?.success(`Article "${title}" updated successfully`);
                } else {
                    console.log('Creating new article');
                    result = await createArticle(articleData);
                    console.log('Create result:', result);
                    window.toast?.success(`Article "${title}" created successfully`);
                }
                
                window.router.navigate(`/wiki/${formSlug}`);
            } catch (error) {
                console.error('Error saving article:', error);
                window.toast?.error('Error saving article: ' + error.message);
            }
        };
    }
};