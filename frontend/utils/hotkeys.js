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
    const modifier = getModifierKey();
    if (withModifier) {
        return `<div class="text-base -mb-px">${modifier}</div> + ${key}`;
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
        displayKey: formatHotkey(HOTKEYS.SEARCH.key.toUpperCase())
    });
    
    // Новая статья - только для админов и суперадминов
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        available.push({
            ...HOTKEYS.NEW_ARTICLE,
            displayKey: formatHotkey(HOTKEYS.NEW_ARTICLE.key.toUpperCase())
        });
    }
    
    // Редактирование статьи - только на странице статьи для авторизованных пользователей с правами
    if (isOnArticlePage && user && (user.role === 'admin' || user.role === 'superadmin')) {
        available.push({
            ...HOTKEYS.EDIT_ARTICLE,
            displayKey: formatHotkey(HOTKEYS.EDIT_ARTICLE.key.toUpperCase())
        });
    }
    
    return available;
}

// Функция для инициализации горячих клавиш
export function initHotkeys(options) {
    const {
        onSearch,
        onNewArticle,
        onEditArticle,
        user,
        isOnArticlePage = false
    } = options;
    
    const handleKeydown = (e) => {
        // Проверяем, не введен ли текст в input или textarea
        const target = e.target;
        const isInputFocused = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.isContentEditable;
        
        // Проверяем нажатие Ctrl (или Cmd на Mac)
        const isModifierPressed = e.ctrlKey || e.metaKey;
        
        if (!isModifierPressed) return;
        
        // Ctrl+K / Cmd+K - поиск
        if (e.code === 'KeyK' && onSearch) {
            e.preventDefault();
            onSearch();
            return;
        }
        
        // Ctrl+N / Cmd+N - новая статья (только для админов)
        if (e.code === 'KeyN' && onNewArticle) {
            e.preventDefault();
            onNewArticle();
            return;
        }
        
        // Ctrl+E / Cmd+E - редактировать статью (только на странице статьи)
        if (e.code === 'KeyE' && onEditArticle && isOnArticlePage) {
            e.preventDefault();
            onEditArticle();
            return;
        }
    };
    
    // Добавляем обработчик
    document.addEventListener('keydown', handleKeydown);
    
    // Возвращаем функцию для удаления обработчика
    return () => {
        document.removeEventListener('keydown', handleKeydown);
    };
}