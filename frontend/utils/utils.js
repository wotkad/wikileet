// HTML экранирование
export function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Расчет времени чтения (средняя скорость 200 слов в минуту)
export function calculateReadTime(content) {
    if (!content) return 1;
    // Удаляем HTML теги
    const text = content.replace(/<[^>]*>/g, '');
    // Считаем слова (разделяем по пробелам)
    const words = text.trim().split(/\s+/).length;
    // Рассчитываем минуты
    const minutes = Math.ceil(words / 200);
    // Минимум 1 минута
    return Math.max(1, minutes);
}

// Генерация slug из заголовка
export function generateSlug(title) {
    if (!title || title.trim() === '') {
        return '';
    }
    
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')      // Удаляем спецсимволы
        .replace(/\s+/g, '-')           // Заменяем пробелы на тире
        .replace(/--+/g, '-')           // Заменяем несколько тире на одно
        .replace(/^-+|-+$/g, '');       // Удаляем тире в начале и конце
}

// Форматирование даты
export function formatDate(date, locale = 'ru-RU', options = {}) {
    if (!date) return 'Unknown';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString(locale, { ...defaultOptions, ...options });
}

// Обрезка текста до определенной длины
export function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Валидация slug (только буквы, цифры и тире)
export function isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug);
}

// Дебаунс функция (для поиска)
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Получение статуса статьи на русском
export function getStatusText(status) {
    switch (status) {
        case 'published': return 'Опубликовано';
        case 'draft': return 'Черновик';
        default: return 'Неизвестно';
    }
}

// Получение цвета статуса для бейджа
export function getStatusColor(status) {
    switch (status) {
        case 'published': return 'bg-green-900 text-green-300';
        case 'draft': return 'bg-yellow-900 text-yellow-300';
        default: return 'bg-gray-900 text-gray-300';
    }
}

// Получение иконки статуса
export function getStatusIcon(status) {
    switch (status) {
        case 'published': return '🚀';
        case 'draft': return '📝';
        default: return '❓';
    }
}