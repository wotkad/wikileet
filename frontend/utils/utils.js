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

// Расчет времени чтения
export function calculateReadTime(content) {
    if (!content) return 1;
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes);
}

// Генерация slug из заголовка
export function generateSlug(title) {
    if (!title || title.trim() === '') return '';
    
    const translitMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    
    let result = '';
    for (let char of title.toLowerCase()) {
        result += translitMap[char] || (char.match(/[a-z0-9]/) ? char : '');
    }
    
    return result.replace(/\s+/g, '-').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
}

// Валидация slug
export function isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug);
}

// Форматирование даты
export function formatDate(date) {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Обрезка текста
export function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Дебаунс функция
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Статусы статей
export function getStatusText(status) {
    switch (status) {
        case 'published': return 'Опубликовано';
        case 'draft': return 'Черновик';
        default: return 'Неизвестно';
    }
}

export function getStatusColor(status) {
    switch (status) {
        case 'published': return 'bg-green-900 text-green-300';
        case 'draft': return 'bg-yellow-900 text-yellow-300';
        default: return 'bg-gray-900 text-gray-300';
    }
}

export function getStatusIcon(status) {
    switch (status) {
        case 'published': return '🚀';
        case 'draft': return '📝';
        default: return '❓';
    }
}