import { getState } from '../state.js';
import { getUserArticles } from '../api.js';
import { escapeHtml, formatDate } from '../utils/utils.js';
import ArticleCard from '../components/ArticleCard.js';
import { renderPagination, attachPaginationEvents } from '../components/Pagination.js';
import { PAGINATION, USER_ROLES, USER_ROLES_TITLE, USER_ROLES_CLASS } from '../constants.js';
import { loadFavorites } from '../components/FavoriteButton.js';
import { initAvatarUpload } from '../components/AvatarUpload.js';

let currentPage = 1;
let favoritesPage = 1;
let currentUser = null;
let currentArticles = [];
let favoritesList = [];
let favoritesEventListener = null;

function onPageChange(page) {
    currentPage = page;
    renderProfilePage();
}

// Загрузка избранных статей с сервера (уже populated)
async function loadFavoritesList() {
    try {
        const response = await fetch('/api/favorites', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch favorites');
        const favorites = await response.json();
        favoritesList = favorites || [];
        return favoritesList;
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        favoritesList = [];
        return [];
    }
}

// Рендер списка избранного
function renderFavoritesList() {
    const limit = PAGINATION.PROFILE_ARTICLES_LIMIT;
    const start = (favoritesPage - 1) * limit;
    const end = start + limit;
    const paginatedFavorites = favoritesList.slice(start, end);
    
    if (paginatedFavorites.length === 0) {
        return '<div class="text-center py-8 text-gray-400">Нет избранных статей. Нажмите на звездочку у статей, чтобы добавить их!</div>';
    }
    
    return paginatedFavorites.map(article => ArticleCard(article)).join('');
}

// Функция для получения отображаемого названия роли
function getRoleDisplay(role) {
    if (role === USER_ROLES.SUPERADMIN) {
        return USER_ROLES_TITLE.superadmin || '👑 СуперАдмин';
    }
    if (role === USER_ROLES.ADMIN) {
        return USER_ROLES_TITLE.admin || '👨‍💼 Администратор';
    }
    return USER_ROLES_TITLE.user || '👤 Пользователь';
}

// Функция для получения CSS класса роли
function getRoleClass(role) {
    if (role === USER_ROLES.SUPERADMIN) {
        return USER_ROLES_CLASS.superadmin || 'bg-red-900 text-red-300';
    }
    if (role === USER_ROLES.ADMIN) {
        return USER_ROLES_CLASS.admin || 'bg-purple-900 text-purple-300';
    }
    return USER_ROLES_CLASS.user || 'bg-blue-800 text-blue-300';
}

async function renderProfilePage() {
    const container = document.getElementById('profile-content');
    if (!container) return;
    
    const user = currentUser;
    const allArticles = currentArticles;
    
    const start = (currentPage - 1) * PAGINATION.PROFILE_ARTICLES_LIMIT;
    const end = start + PAGINATION.PROFILE_ARTICLES_LIMIT;
    const paginatedArticles = allArticles.slice(start, end);
    const totalPages = Math.ceil(allArticles.length / PAGINATION.PROFILE_ARTICLES_LIMIT);
    const favoritesTotalPages = Math.ceil(favoritesList.length / PAGINATION.PROFILE_ARTICLES_LIMIT);
    
    const registeredDate = formatDate(user.createdAt);
    const avatarUrl = user?.avatar ? `/api/profile/avatar/${user.avatar}?t=${Date.now()}` : '/api/profile/avatar/default-avatar.png';
    
    const roleDisplay = getRoleDisplay(user.role);
    const roleClass = getRoleClass(user.role);
    
    container.innerHTML = `
        <div class="mx-auto">
            <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-8">
                <div class="flex items-center gap-6">
                    <div class="flex flex-col items-center space-y-4" id="avatar-upload-component">
                        <div class="relative group">
                            <img src="${avatarUrl}" 
                                 alt="${escapeHtml(user.name)}"
                                 class="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
                                 id="avatar-preview">
                            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition">
                                <button type="button" id="upload-avatar-btn" class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition">
                                    Изменить
                                </button>
                            </div>
                        </div>
                        <input type="file" id="avatar-input" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden">
                        <button type="button" id="remove-avatar-btn" class="text-sm text-red-400 hover:text-red-300 transition ${!user?.avatar ? 'hidden' : ''}">
                            Удалить аватар
                        </button>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold" id="user-name-display">${escapeHtml(user.name)}</h1>
                        <p class="text-gray-300 mt-1" id="user-email-display">${escapeHtml(user.email)}</p>
                        <div class="flex gap-4 mt-3">
                            <span class="px-3 py-1 ${roleClass} rounded-full text-sm">
                                ${roleDisplay}
                            </span>
                            <span class="px-3 py-1 bg-gray-700 rounded-full text-sm">
                                📅 Зарегистрирован: ${registeredDate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">✏️ Редактировать профиль</h2>
                <form id="editProfileForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Имя</label>
                        <input type="text" id="edit-name" value="${escapeHtml(user.name)}" required
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" id="edit-email" value="${escapeHtml(user.email)}" required
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                        Обновить профиль
                    </button>
                </form>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">🔒 Сменить пароль</h2>
                <form id="changePasswordForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Текущий пароль</label>
                        <input type="password" id="current-password" required
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Новый пароль</label>
                        <input type="password" id="new-password" required minlength="6"
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Подтвердите новый пароль</label>
                        <input type="password" id="confirm-password" required minlength="6"
                               class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition">
                        Сменить пароль
                    </button>
                </form>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold mb-4">📝 Недавние статьи</h2>
                <div class="space-y-4">
                    ${paginatedArticles.length > 0 ? 
                        paginatedArticles.map(article => ArticleCard(article)).join('') : 
                        '<div class="text-center py-8 text-gray-400">Нет статей. Создайте свою первую статью!</div>'
                    }
                </div>
                ${renderPagination(currentPage, totalPages)}
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6">
                <h2 class="text-2xl font-bold mb-4">⭐ Избранные статьи</h2>
                <div class="space-y-4" id="favorites-list">
                    ${renderFavoritesList()}
                </div>
                ${renderPagination(favoritesPage, favoritesTotalPages)}
            </div>
        </div>
    `;
    
    attachPaginationEvents(onPageChange);
    
    // Привязываем события пагинации для избранного
    const favoriteContainer = document.querySelector('.bg-gray-800.rounded-lg.p-6:last-child');
    if (favoriteContainer) {
        const favoritePageButtons = favoriteContainer.querySelectorAll('.page-btn');
        const favoritePrevBtn = favoriteContainer.querySelector('.page-prev');
        const favoriteNextBtn = favoriteContainer.querySelector('.page-next');
        
        favoritePageButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                favoritesPage = parseInt(newBtn.dataset.page);
                renderProfilePage();
            });
        });
        
        if (favoritePrevBtn && !favoritePrevBtn.disabled) {
            const newPrevBtn = favoritePrevBtn.cloneNode(true);
            favoritePrevBtn.parentNode.replaceChild(newPrevBtn, favoritePrevBtn);
            newPrevBtn.addEventListener('click', () => {
                favoritesPage = parseInt(newPrevBtn.dataset.page);
                renderProfilePage();
            });
        }
        
        if (favoriteNextBtn && !favoriteNextBtn.disabled) {
            const newNextBtn = favoriteNextBtn.cloneNode(true);
            favoriteNextBtn.parentNode.replaceChild(newNextBtn, favoriteNextBtn);
            newNextBtn.addEventListener('click', () => {
                favoritesPage = parseInt(newNextBtn.dataset.page);
                renderProfilePage();
            });
        }
    }
    
    // Инициализируем загрузку аватара
    setTimeout(() => {
        initAvatarUpload();
    }, 100);
    
    // Инициализируем формы
    initProfileForms();
}

// Инициализация форм
function initProfileForms() {
    // Форма редактирования профиля
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        const newEditForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newEditForm, editForm);
        
        newEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-name').value;
            const email = document.getElementById('edit-email').value;
            
            try {
                const response = await fetch('/api/profile/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Update failed');
                }
                
                const user = await response.json();
                
                const { setState } = await import('../state.js');
                setState({ currentUser: user });
                
                const nameDisplay = document.getElementById('user-name-display');
                const emailDisplay = document.getElementById('user-email-display');
                if (nameDisplay) nameDisplay.textContent = user.name;
                if (emailDisplay) emailDisplay.textContent = user.email;
                
                const { updateHeaderUser } = await import('../components/Header.js');
                updateHeaderUser();
                
                window.toast?.success('Профиль обновлён!');
            } catch (error) {
                console.error('Update error:', error);
                window.toast?.error(error.message);
            }
        });
    }
    
    // Форма смены пароля
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm) {
        const newPasswordForm = passwordForm.cloneNode(true);
        passwordForm.parentNode.replaceChild(newPasswordForm, passwordForm);
        
        newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                window.toast?.warning('Пароли не совпадают');
                return;
            }
            
            if (newPassword.length < 6) {
                window.toast?.warning('Пароль должен быть минимум 6 символов');
                return;
            }
            
            try {
                const response = await fetch('/api/profile/change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword }),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Password change failed');
                }
                
                const data = await response.json();
                
                if (data.user) {
                    const { setState } = await import('../state.js');
                    setState({ currentUser: data.user });
                    const { updateHeaderUser } = await import('../components/Header.js');
                    updateHeaderUser();
                }
                
                window.toast?.success('Пароль изменён!');
                newPasswordForm.reset();
            } catch (error) {
                console.error('Password change error:', error);
                window.toast?.error(error.message);
            }
        });
    }
}

// Функция для обновления списка избранного
async function refreshFavoritesList() {
    await loadFavoritesList();
    const favoritesContainer = document.getElementById('favorites-list');
    if (favoritesContainer) {
        favoritesContainer.innerHTML = renderFavoritesList();
    }
    // Обновляем пагинацию избранного
    const favoriteContainerEl = document.querySelector('.bg-gray-800.rounded-lg.p-6:last-child');
    if (favoriteContainerEl) {
        const newFavoritesTotalPages = Math.ceil(favoritesList.length / PAGINATION.PROFILE_ARTICLES_LIMIT);
        const paginationContainer = favoriteContainerEl.querySelector('.flex.justify-center');
        if (paginationContainer && newFavoritesTotalPages > 1) {
            const newPagination = renderPagination(favoritesPage, newFavoritesTotalPages);
            paginationContainer.outerHTML = newPagination;
            const newButtons = favoriteContainerEl.querySelectorAll('.page-btn');
            const newPrev = favoriteContainerEl.querySelector('.page-prev');
            const newNext = favoriteContainerEl.querySelector('.page-next');
            
            newButtons.forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', () => {
                    favoritesPage = parseInt(newBtn.dataset.page);
                    renderProfilePage();
                });
            });
            if (newPrev) {
                const newPrevBtn = newPrev.cloneNode(true);
                newPrev.parentNode.replaceChild(newPrevBtn, newPrev);
                newPrevBtn.addEventListener('click', () => {
                    favoritesPage = parseInt(newPrevBtn.dataset.page);
                    renderProfilePage();
                });
            }
            if (newNext) {
                const newNextBtn = newNext.cloneNode(true);
                newNext.parentNode.replaceChild(newNextBtn, newNext);
                newNextBtn.addEventListener('click', () => {
                    favoritesPage = parseInt(newNextBtn.dataset.page);
                    renderProfilePage();
                });
            }
        } else if (paginationContainer && newFavoritesTotalPages <= 1) {
            paginationContainer.remove();
        }
    }
}

export default async function ProfilePage() {
    const state = getState();
    const user = state.currentUser;
    
    if (!user) {
        window.router.navigate('/login');
        return '<div class="text-center py-12">Перенаправление на вход...</div>';
    }
    
    const userId = user._id || user.id;
    
    let articles = [];
    try {
        const articlesData = await getUserArticles(userId);
        articles = articlesData.articles || [];
    } catch (error) {
        console.error('Ошибка загрузки статей:', error);
    }
    
    currentUser = user;
    currentArticles = articles;
    currentPage = 1;
    favoritesPage = 1;
    
    // Загружаем избранное
    await loadFavorites();
    await loadFavoritesList();
    
    // Удаляем старый обработчик, если есть
    if (favoritesEventListener) {
        window.removeEventListener('favorites:updated', favoritesEventListener);
    }
    
    // Создаём новый обработчик
    favoritesEventListener = async () => {
        console.log('[ProfilePage] Обновление избранного');
        await refreshFavoritesList();
    };
    
    // Подписываемся на обновление избранного
    window.addEventListener('favorites:updated', favoritesEventListener);
    
    setTimeout(() => {
        renderProfilePage();
    }, 0);
    
    return `
        <div id="profile-content" class="mx-auto">
            <div class="text-center py-12">Загрузка профиля...</div>
        </div>
    `;
}

// Очистка при уходе со страницы (опционально)
export function cleanupProfilePage() {
    if (favoritesEventListener) {
        window.removeEventListener('favorites:updated', favoritesEventListener);
        favoritesEventListener = null;
    }
}