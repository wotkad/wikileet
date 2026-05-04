// Функция для определения платформы (Mac или Windows/Linux)
export function isMac() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

// Функция для получения отображаемого названия модификатора
export function getModifierKey() {
    return isMac() ? '⌘' : 'Ctrl';
}

// Функция для форматирования комбинации клавиш
export function formatHotkey(key, withModifier = true) {
    if (withModifier) {
        return `G + ${key.toUpperCase()}`;
    }
    return key;
}

// Список всех горячих клавиш
export const HOTKEYS = {
    SEARCH: { key: 'k', description: 'Поиск', action: 'focusSearch' },
    NEW_ARTICLE: { key: 'n', description: 'Новая статья', action: 'newArticle', requiresAdmin: true },
    EDIT_ARTICLE: { key: 'e', description: 'Редактировать статью', action: 'editArticle', requiresAuth: true }
};

// Функция для получения списка доступных горячих клавиш для текущего пользователя
export function getAvailableHotkeys(user, isOnArticlePage = false) {
    const available = [];
    
    // Поиск доступен всем
    available.push({
        ...HOTKEYS.SEARCH,
        displayKey: formatHotkey(HOTKEYS.SEARCH.key)
    });
    
    // Новая статья - только для админов и суперадминов
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        available.push({
            ...HOTKEYS.NEW_ARTICLE,
            displayKey: formatHotkey(HOTKEYS.NEW_ARTICLE.key)
        });
    }
    
    // Редактирование статьи - только на странице статьи для авторизованных пользователей с правами
    if (isOnArticlePage && user && (user.role === 'admin' || user.role === 'superadmin')) {
        available.push({
            ...HOTKEYS.EDIT_ARTICLE,
            displayKey: formatHotkey(HOTKEYS.EDIT_ARTICLE.key)
        });
    }
    
    return available;
}

// Функция для проверки, удерживается ли клавиша G
let isGPressed = false;

// Функция для инициализации горячих клавиш
export function initHotkeys(options) {
    const {
        onSearch,
        onNewArticle,
        onEditArticle,
        user,
        isOnArticlePage = false
    } = options;
    
    // Сбрасываем состояние при потере фокуса окна
    const handleBlur = () => {
        isGPressed = false;
    };
    
    // Обработчик нажатия клавиш
    const handleKeyDown = (e) => {
        // Проверяем, не введен ли текст в input или textarea
        const target = e.target;
        const isInputFocused = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.isContentEditable;
        
        // Если клавиша G нажата
        if (e.code === 'KeyG') {
            isGPressed = true;
            return;
        }
        
        // Если G не удерживается - игнорируем комбинации
        if (!isGPressed) return;
        
        // G + K - поиск
        if (e.code === 'KeyK' && onSearch) {
            e.preventDefault();
            onSearch();
            isGPressed = false;
            return;
        }
        
        // G + N - новая статья (только для админов)
        if (e.code === 'KeyN' && onNewArticle) {
            e.preventDefault();
            onNewArticle();
            isGPressed = false;
            return;
        }
        
        // G + E - редактировать статью (только на странице статьи)
        if (e.code === 'KeyE' && onEditArticle && isOnArticlePage) {
            e.preventDefault();
            onEditArticle();
            isGPressed = false;
            return;
        }
    };
    
    // Сбрасываем состояние при отпускании клавиш
    const handleKeyUp = (e) => {
        if (e.code === 'KeyG') {
            isGPressed = false;
        }
    };
    
    // Добавляем обработчики
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    
    // Возвращаем функцию для удаления обработчиков
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
        isGPressed = false;
    };
}