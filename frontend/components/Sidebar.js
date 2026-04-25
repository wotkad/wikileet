import { getState } from '../state.js';

export default function Sidebar() {
    const state = getState();
    
    return `
        <aside class="sidebar w-64 bg-gray-800 border-r border-gray-700 fixed lg:relative lg:translate-x-0 transform -translate-x-full transition-transform duration-200 ease-in-out z-40 h-full overflow-y-auto" id="sidebar">
            <div class="p-4 space-y-6">
                <div>
                    <h3 class="text-lg font-semibold mb-3 text-blue-400">Navigation</h3>
                    <div class="space-y-2">
                        <a href="/" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                            <span>🏠</span>
                            <span>Home</span>
                        </a>
                        <a href="/wiki" class="block px-3 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2">
                            <span>📚</span>
                            <span>All Articles</span>
                        </a>
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-3 text-blue-400">Categories</h3>
                    <div class="space-y-1" id="categories-list">
                        ${renderCategories(state.categories)}
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-3 text-blue-400">Popular Tags</h3>
                    <div class="flex flex-wrap gap-2" id="tags-list">
                        ${renderTags(state.tags)}
                    </div>
                </div>
            </div>
        </aside>
    `;
}

function renderCategories(categories) {
    if (!categories || categories.length === 0) {
        return '<div class="text-gray-400 text-sm">No categories yet</div>';
    }
    
    return categories.map(cat => `
        <a href="/wiki?category=${cat._id}" class="category-link block px-3 py-2 rounded hover:bg-gray-700 transition text-sm">
            ${cat.name}
        </a>
    `).join('');
}

function renderTags(tags) {
    if (!tags || tags.length === 0) {
        return '<div class="text-gray-400 text-sm">No tags yet</div>';
    }
    
    return tags.map(tag => `
        <a href="/wiki?tags=${tag._id}" class="tag-link px-2 py-1 bg-gray-700 rounded-full text-xs hover:bg-gray-600 transition inline-block">
            ${tag.name}
        </a>
    `).join('');
}