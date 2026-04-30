// Пагинация
export const PAGINATION = {
    HOME_RECENT_LIMIT: 5,
    HOME_POPULAR_LIMIT: 5,
    WIKI_LIMIT: 10,
    USERS_LIMIT: 10,
    ADMIN_ARTICLES_LIMIT: 10,
    PROFILE_ARTICLES_LIMIT: 5,
    SIMILAR_ARTICLES_LIMIT: 5,
};

// Загрузка файлов
export const UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    AVATAR_SIZE: 200,
    AVATAR_QUALITY: 80,
    DEFAULT_AVATAR: '/api/profile/avatar/default-avatar.png',
};

// Поиск
export const SEARCH = {
    DEBOUNCE_DELAY: 500,
};

// Время чтения
export const READ_TIME = {
    WORDS_PER_MINUTE: 200,
    MIN_READ_TIME: 1,
};

// Отображение
export const DISPLAY = {
    MAX_VISIBLE_PAGES: 5,
    MAX_TAGS_IN_CARD: 2,
    MAX_TAGS_IN_FILTER: 10,
    TRUNCATE_DESCRIPTION_LENGTH: 120,
};

// Статусы статей
export const ARTICLE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    SCHEDULED: 'scheduled',
};

// Роли пользователей
export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
};