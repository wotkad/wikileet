import { debounce, escapeHtml } from '../utils/utils.js';
import { SEARCH } from '../constants.js';

// Глобальное состояние для подсказок
let currentSuggestions = [];
let currentSuggestionType = 'articles'; // 'articles' или 'users'
let selectedSuggestionIndex = -1;
let currentQuery = ''; // Сохраняем последний запрос

// API для поиска подсказок
async function fetchSuggestions(query, type) {
    if (!query || query.length < 2) return [];
    
    try {
        if (type === 'articles') {
            const response = await fetch(`/api/articles/search?q=${encodeURIComponent(query)}&limit=5`, {
                credentials: 'include'
            });
            if (!response.ok) return [];
            const data = await response.json();
            return data.map(article => ({
                id: article._id,
                title: article.title,
                slug: article.slug,
                type: 'article',
                url: `/wiki/${article.slug}`,
                description: article.description
            }));
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

// Рендер выпадающего списка подсказок
function renderSuggestions(suggestions, type) {
    const container = document.getElementById('search-suggestions');
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
                        <div class="font-medium text-sm">${escapeHtml(item.title)}</div>
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

// Скрыть подсказки
function hideSuggestions() {
    const container = document.getElementById('search-suggestions');
    if (container) {
        container.classList.add('hidden');
        // НЕ ОЧИЩАЕМ innerHTML, чтобы при повторном фокусе подсказки остались
    }
    selectedSuggestionIndex = -1;
}

// Показать подсказки (если есть)
function showSuggestions() {
    const container = document.getElementById('search-suggestions');
    if (container && currentSuggestions && currentSuggestions.length > 0) {
        container.classList.remove('hidden');
    }
}

// Обработка клавиш навигации по подсказкам
function handleKeyboardNavigation(e, suggestions, type) {
    if (!suggestions || suggestions.length === 0) return false;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            renderSuggestions(suggestions, type);
            return true;
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            renderSuggestions(suggestions, type);
            return true;
        case 'Enter':
            if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                e.preventDefault();
                const selected = suggestions[selectedSuggestionIndex];
                if (window.router) {
                    hideSuggestions();
                    window.router.navigate(selected.url);
                }
                return true;
            }
            return false;
        case 'Escape':
            hideSuggestions();
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
            <div id="search-suggestions" class="absolute z-50 w-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden hidden">
                <div class="max-h-64 overflow-y-auto">
                    <!-- Подсказки будут вставлены сюда -->
                </div>
            </div>
        </div>
    `;
}

export function initSearchInput(options) {
    const {
        id = 'searchInput',
        onSearch,
        type = 'articles',
        delay = SEARCH.DEBOUNCE_DELAY
    } = options;
    
    const searchInput = document.getElementById(id);
    if (!searchInput) return null;
    
    // Сохраняем текущее значение
    const currentValue = searchInput.value;
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.value = currentValue;
    
    // Создаем контейнер для подсказок, если его нет
    let suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer) {
        const wrapper = newSearchInput.closest('.relative');
        if (wrapper) {
            const container = document.createElement('div');
            container.id = 'search-suggestions';
            container.className = 'absolute z-50 w-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden hidden';
            container.innerHTML = '<div class="max-h-64 overflow-y-auto"></div>';
            wrapper.appendChild(container);
            suggestionsContainer = container;
        }
    }
    
    // Функция для обновления подсказок
    const updateSuggestions = async (query) => {
        currentQuery = query;
        if (!query || query.length < 2) {
            hideSuggestions();
            currentSuggestions = [];
            return;
        }
        
        currentSuggestions = await fetchSuggestions(query, type);
        currentSuggestionType = type;
        selectedSuggestionIndex = -1;
        renderSuggestions(currentSuggestions, type);
    };
    
    // Создаем debounced функцию для подсказок
    const debouncedSuggestions = debounce(updateSuggestions, 300);
    
    // Добавляем обработчик input
    newSearchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        debouncedSuggestions(value);
        
        // Вызываем onSearch для обновления основного списка
        if (onSearch && typeof onSearch === 'function') {
            onSearch(value);
        }
    });
    
    // Добавляем обработчик focus - показываем подсказки если есть
    newSearchInput.addEventListener('focus', () => {
        if (currentSuggestions && currentSuggestions.length > 0 && currentQuery && currentQuery.length >= 2) {
            showSuggestions();
        }
    });
    
    // Добавляем обработчик keydown для навигации по подсказкам
    newSearchInput.addEventListener('keydown', (e) => {
        const handled = handleKeyboardNavigation(e, currentSuggestions, type);
        if (handled) {
            e.preventDefault();
            return;
        }
        
        // Enter для отправки поиска без выбранной подсказки
        if (e.key === 'Enter' && selectedSuggestionIndex === -1) {
            e.preventDefault();
            if (onSearch && typeof onSearch === 'function') {
                onSearch(e.target.value);
                hideSuggestions();
            }
        }
    });
    
    // Закрываем подсказки при потере фокуса (НО НЕ ОЧИЩАЕМ)
    newSearchInput.addEventListener('blur', () => {
        setTimeout(() => {
            hideSuggestions(); // Просто скрываем, не очищая содержимое
        }, 200);
    });
    
    // Восстанавливаем фокус и позицию курсора
    const len = newSearchInput.value.length;
    newSearchInput.setSelectionRange(len, len);
    
    return () => {
        // Очистка при необходимости
    };
}