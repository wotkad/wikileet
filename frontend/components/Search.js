import { debounce } from '../utils/utils.js';
import { SEARCH } from '../constants.js';

export function renderSearchInput(options) {
    const {
        id = 'searchInput',
        placeholder = 'Поиск...',
        initialValue = '',
        delay = SEARCH.DEBOUNCE_DELAY,
        className = 'w-full px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
    } = options;
    
    return `
        <input type="text" 
               id="${id}" 
               placeholder="${placeholder}" 
               autocomplete="off"
               value="${escapeHtml(initialValue)}"
               class="${className}">
    `;
}

export function initSearchInput(options) {
    const {
        id = 'searchInput',
        onSearch,
        delay = SEARCH.DEBOUNCE_DELAY
    } = options;
    
    const searchInput = document.getElementById(id);
    if (!searchInput) return null;
    
    // Сохраняем текущее значение
    const currentValue = searchInput.value;
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.value = currentValue;
    
    // Создаем debounced функцию поиска
    const debouncedSearch = debounce((value) => {
        if (onSearch && typeof onSearch === 'function') {
            onSearch(value);
        }
    }, delay);
    
    // Добавляем обработчик input
    newSearchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Добавляем обработчик Enter
    newSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (onSearch && typeof onSearch === 'function') {
                onSearch(e.target.value);
            }
        }
    });
    
    // Восстанавливаем фокус и позицию курсора
    const len = newSearchInput.value.length;
    newSearchInput.setSelectionRange(len, len);
    
    // Возвращаем функцию для очистки
    return () => {
        newSearchInput.removeEventListener('input', debouncedSearch);
    };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}