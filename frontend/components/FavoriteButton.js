// Глобальное состояние (приватное для модуля)
let favoritesSet = new Set();
let isLoading = false;
let loadPromise = null;
let isInitialized = false;

// Загрузка избранного с сервера (один раз, с кешем)
export async function loadFavorites() {
    if (isLoading) return loadPromise;
    if (favoritesSet.size > 0 && isInitialized) return;

    isLoading = true;
    loadPromise = (async () => {
        try {
            const response = await fetch('/api/favorites', { credentials: 'include' });
            if (!response.ok) throw new Error('Ошибка загрузки');
            const favorites = await response.json();
            favoritesSet = new Set(favorites.map(fav => fav._id || fav));
            isInitialized = true;
            // Оповещаем все кнопки об обновлении
            window.dispatchEvent(new CustomEvent('favorites:updated'));
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
        } finally {
            isLoading = false;
        }
    })();
    return loadPromise;
}

// Обновление на сервере и в глобальном состоянии
async function updateFavoriteOnServer(articleId, isFavorited) {
    const method = isFavorited ? 'POST' : 'DELETE';
    const response = await fetch(`/api/favorites/${articleId}`, { method, credentials: 'include' });
    if (!response.ok) throw new Error('Ошибка обновления');
    // Обновляем глобальный Set
    if (isFavorited) favoritesSet.add(articleId);
    else favoritesSet.delete(articleId);
    // Оповещаем все кнопки
    window.dispatchEvent(new CustomEvent('favorites:updated'));
}

// Обновление всех кнопок с данным ID
function updateAllButtons(articleId, isFavorited) {
    const allButtons = document.querySelectorAll(`.favorite-btn[data-id="${articleId}"]`);
    allButtons.forEach(btn => {
        btn.dataset.favorited = String(isFavorited);
        if (isFavorited) {
            btn.classList.remove('text-gray-500', 'hover:text-yellow-400');
            btn.classList.add('text-yellow-400');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'currentColor');
        } else {
            btn.classList.remove('text-yellow-400');
            btn.classList.add('text-gray-500', 'hover:text-yellow-400');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'none');
        }
    });
}

// Глобальный обработчик кликов (для всех кнопок)
function setupGlobalClickHandler() {
    if (window.favoriteClickHandlerSetup) return;
    window.favoriteClickHandlerSetup = true;
    
    document.body.addEventListener('click', async (e) => {
        const btn = e.target.closest('.favorite-btn');
        if (!btn) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const articleId = btn.dataset.id;
        const isCurrentlyFavorited = btn.dataset.favorited === 'true';
        const newState = !isCurrentlyFavorited;
        
        // Оптимистичное обновление всех кнопок с этим ID
        updateAllButtons(articleId, newState);
        
        try {
            await updateFavoriteOnServer(articleId, newState);
        } catch (error) {
            // Откат при ошибке
            updateAllButtons(articleId, isCurrentlyFavorited);
            window.toast?.error(error.message);
        }
    });
}

/**
 * Компонент кнопки "Избранное"
 * @param {string} articleId - ID статьи
 * @returns {string} HTML-строка с кнопкой
 */
export default function FavoriteButton(articleId) {
    // Настраиваем глобальный обработчик один раз
    setupGlobalClickHandler();
    
    const renderIcon = () => {
        return `
            <button class="favorite-btn p-1 rounded-full transition text-gray-500 hover:text-yellow-400" data-id="${articleId}" data-favorited="false">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
            </button>
        `;
    };
    
    // Инициализация: загружаем избранное и обновляем все кнопки
    setTimeout(async () => {
        await loadFavorites();
        const isFav = favoritesSet.has(articleId);
        updateAllButtons(articleId, isFav);
    }, 0);
    
    // Подписываемся на глобальное обновление
    if (!window.favoritesEventListener) {
        window.favoritesEventListener = true;
        window.addEventListener('favorites:updated', () => {
            // Обновляем все кнопки на странице
            const allButtons = document.querySelectorAll('.favorite-btn');
            allButtons.forEach(btn => {
                const id = btn.dataset.id;
                const isFav = favoritesSet.has(id);
                if (isFav) {
                    btn.dataset.favorited = 'true';
                    btn.classList.remove('text-gray-500', 'hover:text-yellow-400');
                    btn.classList.add('text-yellow-400');
                    const svg = btn.querySelector('svg');
                    if (svg) svg.setAttribute('fill', 'currentColor');
                } else {
                    btn.dataset.favorited = 'false';
                    btn.classList.remove('text-yellow-400');
                    btn.classList.add('text-gray-500', 'hover:text-yellow-400');
                    const svg = btn.querySelector('svg');
                    if (svg) svg.setAttribute('fill', 'none');
                }
            });
        });
    }
    
    return renderIcon();
}