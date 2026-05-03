import { debounce, escapeHtml } from '../utils/utils.js';
import { SEARCH } from '../constants.js';

let currentSuggestions = [];
let currentSuggestionType = 'articles';
let selectedSuggestionIndex = -1;
let currentQuery = '';

function hasMediaInContent(content) {
    if (!content) return { hasImage: false, hasVideo: false };
    
    const imagePatterns = [
        /<img[^>]+src=["'][^"']+["']/gi,
        /\/api\/media\/file\/[^"'\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi
    ];
    
    const videoPatterns = [
        /<video[^>]*>[\s\S]*?<\/video>/gi,
        /\/api\/media\/file\/[^"'\s)]+\.(mp4|webm|mov|ogg)/gi
    ];
    
    let hasImage = false;
    let hasVideo = false;
    
    for (const pattern of imagePatterns) {
        if (pattern.test(content)) {
            hasImage = true;
            break;
        }
    }
    
    for (const pattern of videoPatterns) {
        if (pattern.test(content)) {
            hasVideo = true;
            break;
        }
    }
    
    return { hasImage, hasVideo };
}

async function fetchSuggestions(query, type) {
    if (!query || query.length < 2) return [];
    
    try {
        if (type === 'articles') {
            const response = await fetch(`/api/articles/search?q=${encodeURIComponent(query)}&limit=5`, {
                credentials: 'include'
            });
            if (!response.ok) return [];
            const data = await response.json();
            return data.map(article => {
                const { hasImage, hasVideo } = hasMediaInContent(article.content);
                let mediaIcon = '';
                let mediaClass = '';
                
                if (hasImage && hasVideo) {
                    mediaIcon = '🎬📷';
                    mediaClass = 'text-purple-400';
                } else if (hasVideo) {
                    mediaIcon = '🎬';
                    mediaClass = 'text-red-400';
                } else if (hasImage) {
                    mediaIcon = '📷';
                    mediaClass = 'text-green-400';
                }
                
                return {
                    id: article._id,
                    title: article.title,
                    slug: article.slug,
                    type: 'article',
                    url: `/wiki/${article.slug}`,
                    description: article.description,
                    mediaIcon,
                    mediaClass,
                    hasImage,
                    hasVideo
                };
            });
        } else {
            const response = await fetch(`/api/profile/users/search?q=${encodeURIComponent(query)}&limit=5`, {
                credentials: 'include'
            });
            if (!response.ok) return [];
            const data = await response.json();
            return data.map(user => ({
                id: user._id,
                title: user.name,
                slug: user.slug,
                type: 'user',
                url: `/profile/${user.slug}`,
                avatar: user.avatar
            }));
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

function renderSuggestions(suggestions, type, suggestionsId) {
    const container = document.getElementById(suggestionsId);
    if (!container) return;
    
    if (!suggestions || suggestions.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }
    
    container.classList.remove('hidden');
    
    if (type === 'articles') {
        container.innerHTML = `
            <div class="p-2 border-b border-gray-700">
                <span class="text-xs text-gray-500">Статьи</span>
            </div>
            <div class="max-h-64 overflow-y-auto">
                ${suggestions.map((item, index) => `
                    <a href="${item.url}" 
                       class="suggestion-item block px-3 py-2 hover:bg-gray-700 transition ${index === selectedSuggestionIndex ? 'bg-gray-700' : ''}"
                       data-index="${index}"
                       data-url="${item.url}">
                        <div class="flex items-center justify-between">
                            <div class="font-medium text-sm">${escapeHtml(item.title)}</div>
                            ${item.mediaIcon ? `<span class="${item.mediaClass} text-xs ml-2">${item.mediaIcon}</span>` : ''}
                        </div>
                        <div class="text-xs text-gray-400">${escapeHtml(item.description?.substring(0, 80) || '')}</div>
                    </a>
                `).join('')}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="p-2 border-b border-gray-700">
                <span class="text-xs text-gray-500">Пользователи</span>
            </div>
            <div class="max-h-64 overflow-y-auto">
                ${suggestions.map((item, index) => `
                    <a href="${item.url}" 
                       class="suggestion-item block px-3 py-2 hover:bg-gray-700 transition ${index === selectedSuggestionIndex ? 'bg-gray-700' : ''}"
                       data-index="${index}"
                       data-url="${item.url}">
                        <div class="flex items-center gap-2">
                            <img src="${item.avatar ? `/api/profile/avatar/${item.avatar}` : '/api/profile/avatar/default-avatar.png'}" 
                                 class="w-6 h-6 rounded-full object-cover"
                                 onerror="this.src='/api/profile/avatar/default-avatar.png'">
                            <div class="font-medium text-sm">${escapeHtml(item.title)}</div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
    }
}

function hideSuggestions(suggestionsId) {
    const container = document.getElementById(suggestionsId);
    if (container) {
        container.classList.add('hidden');
    }
    selectedSuggestionIndex = -1;
}

function showSuggestions(suggestionsId) {
    const container = document.getElementById(suggestionsId);
    if (container && currentSuggestions && currentSuggestions.length > 0) {
        container.classList.remove('hidden');
    }
}

function handleKeyboardNavigation(e, suggestions, type, suggestionsId) {
    if (!suggestions || suggestions.length === 0) return false;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            renderSuggestions(suggestions, type, suggestionsId);
            return true;
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            renderSuggestions(suggestions, type, suggestionsId);
            return true;
        case 'Enter':
            if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                e.preventDefault();
                const selected = suggestions[selectedSuggestionIndex];
                if (window.router) {
                    hideSuggestions(suggestionsId);
                    window.router.navigate(selected.url);
                }
                return true;
            }
            return false;
        case 'Escape':
            hideSuggestions(suggestionsId);
            return true;
        default:
            return false;
    }
}

export function renderSearchInput(options) {
    const {
        id = 'searchInput',
        placeholder = 'Поиск...',
        initialValue = '',
        suggestionsId = 'search-suggestions',
        className = 'w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
    } = options;
    
    return `
        <div class="relative">
            <input type="text" 
                   id="${id}" 
                   placeholder="${placeholder}" 
                   autocomplete="off"
                   value="${escapeHtml(initialValue)}"
                   class="${className}">
            <div id="${suggestionsId}" class="absolute z-50 w-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden hidden">
            </div>
        </div>
    `;
}

export function initSearchInput(options) {
    const {
        id = 'searchInput',
        onSearch,
        type = 'articles',
        submitOnly = false,
        suggestionsId = 'search-suggestions'
    } = options;
    
    const searchInput = document.getElementById(id);
    if (!searchInput) return null;
    
    const currentValue = searchInput.value;
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.value = currentValue;
    
    let suggestionsContainer = document.getElementById(suggestionsId);
    if (!suggestionsContainer) {
        const wrapper = newSearchInput.closest('.relative');
        if (wrapper) {
            const container = document.createElement('div');
            container.id = suggestionsId;
            container.className = 'absolute z-50 w-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden hidden';
            wrapper.appendChild(container);
            suggestionsContainer = container;
        }
    }
    
    const updateSuggestions = async (query) => {
        currentQuery = query;
        if (!query || query.length < 2) {
            hideSuggestions(suggestionsId);
            currentSuggestions = [];
            return;
        }
        
        currentSuggestions = await fetchSuggestions(query, type);
        currentSuggestionType = type;
        selectedSuggestionIndex = -1;
        renderSuggestions(currentSuggestions, type, suggestionsId);
    };
    
    const debouncedSuggestions = debounce(updateSuggestions, 300);
    
    newSearchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (!submitOnly) {
            debouncedSuggestions(value);
            
            if (onSearch && typeof onSearch === 'function') {
                onSearch(value);
            }
        } else {
            debouncedSuggestions(value);
        }
    });
    
    newSearchInput.addEventListener('focus', () => {
        if (currentSuggestions && currentSuggestions.length > 0 && currentQuery && currentQuery.length >= 2) {
            showSuggestions(suggestionsId);
        }
    });
    
    newSearchInput.addEventListener('keydown', (e) => {
        const handled = handleKeyboardNavigation(e, currentSuggestions, type, suggestionsId);
        if (handled) {
            e.preventDefault();
            return;
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            if (onSearch && typeof onSearch === 'function') {
                onSearch(e.target.value);
                hideSuggestions(suggestionsId);
            }
        }
    });
    
    newSearchInput.addEventListener('blur', () => {
        setTimeout(() => {
            hideSuggestions(suggestionsId);
        }, 200);
    });
    
    const len = newSearchInput.value.length;
    newSearchInput.setSelectionRange(len, len);
    
    return () => {};
}