// Пагинация
export const PAGINATION = {
    HOME_RECENT_LIMIT: 5,
    HOME_POPULAR_LIMIT: 5,
    WIKI_LIMIT: 10,
    USERS_LIMIT: 10,
    ADMIN_ARTICLES_LIMIT: 10,
    PROFILE_ARTICLES_LIMIT: 5,
    SIMILAR_ARTICLES_LIMIT: 5,
    MEDIA_LIMIT: 20,
};

// Загрузка файлов
export const UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DEFAULT_AVATAR: '/api/profile/avatar/default-avatar.png',
};

// Поиск
export const SEARCH = {
    DEBOUNCE_DELAY: 50,
};

// Время чтения
export const READ_TIME = {
    WORDS_PER_MINUTE: 200,
};

// Отображение
export const DISPLAY = {
    MAX_VISIBLE_PAGES: 5,
    MAX_TAGS_IN_CARD: 2,
    TRUNCATE_DESCRIPTION_LENGTH: 120,
};

// Статусы статей
export const ARTICLE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
};

export const ARTICLE_STATUS_TITLE = {
    draft: '📝 Черновик',
    published: '🚀 Опубликовано',
};

// Роли пользователей (значения для базы данных)
export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin',
};

// Отображаемые названия ролей
export const USER_ROLES_TITLE = {
    user: '👤 Пользователь',
    admin: '👨‍💼 Администратор',
    superadmin: '👑 СуперАдмин',
};

// CSS классы для бейджей ролей
export const USER_ROLES_CLASS = {
    user: 'bg-blue-800 text-blue-300',
    admin: 'bg-purple-900 text-purple-300',
    superadmin: 'bg-red-900 text-red-300',
};

// Функция для проверки доступа к админ-панели
export function hasAdminAccess(user) {
    return user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPERADMIN);
}

// Функция для проверки, может ли пользователь менять роли
export function canManageRoles(user) {
    return user && user.role === USER_ROLES.SUPERADMIN;
}