import { getUserBySlug, getUserArticles } from '../api.js';
import { escapeHtml, formatDate } from '../utils/utils.js';
import ArticleCard from '../components/ArticleCard.js';
import { renderPagination, attachPaginationEvents } from '../components/Pagination.js';
import { PAGINATION, UPLOAD, USER_ROLES, USER_ROLES_TITLE } from '../constants.js';
import { getState } from '../state.js';

let currentPage = 1;
let currentUser = null;
let currentArticles = [];

function onPageChange(page) {
    currentPage = page;
    renderUserProfilePage(currentUser, currentArticles);
}

// Функция для изменения роли пользователя
async function changeUserRole(userId, newRole) {
    try {
        const response = await fetch(`/api/profile/user/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to change role');
        }

        const data = await response.json();
        window.toast?.success(`Роль пользователя изменена на ${newRole === USER_ROLES.ADMIN ? 'Администратора' : 'Пользователя'}`);
        
        // Обновляем текущего пользователя
        currentUser = data.user;
        
        // Перерендериваем страницу
        renderUserProfilePage(currentUser, currentArticles);
    } catch (error) {
        console.error('Error changing role:', error);
        window.toast?.error(error.message);
    }
}

// Функция для проверки, может ли текущий пользователь редактировать роли
function canEditRoles(targetUser) {
    const state = getState();
    const loggedInUser = state.currentUser;
    
    if (!loggedInUser) return false;
    
    // Только admin может менять роли
    if (loggedInUser.role !== 'admin') return false;
    
    // Нельзя менять свою роль
    if (loggedInUser._id === targetUser._id) return false;
    
    return true;
}

// Функция для отображения выпадающего списка ролей (только для admin)
function renderRoleSelector(user) {
    const state = getState();
    const loggedInUser = state.currentUser;
    const canEdit = canEditRoles(user);
    
    const roleDisplay = user.role === USER_ROLES.ADMIN ? USER_ROLES_TITLE.ADMIN : USER_ROLES_TITLE.USER;
    const roleBadgeClass = user.role === USER_ROLES.ADMIN ? 'bg-purple-900 text-purple-300' : 'bg-blue-800 text-blue-300';
    
    if (!canEdit) {
        return `
            <span class="px-3 py-1 ${roleBadgeClass} rounded-full text-sm">
                ${roleDisplay}
            </span>
        `;
    }
    
    // Для admin показываем выпадающий список
    return `
        <div class="relative inline-block">
            <select id="role-select" class="px-3 py-1 bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="user" ${user.role === USER_ROLES.USER ? 'selected' : ''}>${USER_ROLES_TITLE.USER}</option>
                <option value="admin" ${user.role === USER_ROLES.ADMIN ? 'selected' : ''}>${USER_ROLES_TITLE.ADMIN}</option>
            </select>
        </div>
    `;
}

function renderUserProfilePage(user, allArticles) {
    const start = (currentPage - 1) * PAGINATION.PROFILE_ARTICLES_LIMIT;
    const end = start + PAGINATION.PROFILE_ARTICLES_LIMIT;
    const paginatedArticles = allArticles.slice(start, end);
    const totalPages = Math.ceil(allArticles.length / PAGINATION.PROFILE_ARTICLES_LIMIT);
    
    const container = document.getElementById('user-profile-content');
    if (!container) return;
    
    const publishedArticles = allArticles.filter(a => a.status === 'published');
    const registeredDate = formatDate(user.createdAt);
    const avatarUrl = user?.avatar ? `/api/profile/avatar/${user.avatar}?t=${Date.now()}` : UPLOAD.DEFAULT_AVATAR;
    
    container.innerHTML = `
        <div class="mx-auto">
            <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-8 mb-8">
                <div class="flex items-center gap-6">
                    <div class="flex flex-col items-center space-y-4">
                        <img src="${avatarUrl}" 
                             alt="${escapeHtml(user.name)}"
                             class="w-32 h-32 rounded-full object-cover border-4 border-gray-700">
                    </div>
                    <div class="flex-1">
                        <h1 class="text-3xl font-bold">${escapeHtml(user.name)}</h1>
                        <p class="text-gray-300 mt-1">${escapeHtml(user.email)}</p>
                        <div class="flex gap-4 mt-3 flex-wrap">
                            ${renderRoleSelector(user)}
                            <span class="px-3 py-1 bg-gray-700 rounded-full text-sm">
                                📅 Зарегистрирован: ${registeredDate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6">
                <h2 class="text-2xl font-bold mb-4">📝 Записи ${escapeHtml(user.name)}</h2>
                <div class="space-y-4">
                    ${paginatedArticles.length > 0 ? 
                        paginatedArticles.map(article => ArticleCard(article)).join('') : 
                        '<div class="text-center py-8 text-gray-400">Записей ещё нет</div>'
                    }
                </div>
                ${renderPagination(currentPage, totalPages)}
            </div>
        </div>
    `;
    
    // Добавляем обработчик для выпадающего списка ролей
    const roleSelect = document.getElementById('role-select');
    if (roleSelect) {
        const newRoleSelect = roleSelect.cloneNode(true);
        roleSelect.parentNode.replaceChild(newRoleSelect, roleSelect);
        
        newRoleSelect.addEventListener('change', async (e) => {
            const newRole = e.target.value;
            const confirmed = confirm(`Вы уверены, что хотите изменить роль пользователя ${user.name} на ${newRole === USER_ROLES.ADMIN ? 'Администратора' : 'Пользователя'}?`);
            
            if (confirmed) {
                await changeUserRole(user._id, newRole);
            } else {
                // Возвращаем предыдущее значение
                newRoleSelect.value = user.role;
            }
        });
    }
    
    attachPaginationEvents(onPageChange);
}

export default async function UserProfilePage(params) {
    const slug = params.slug;
    
    if (!slug) {
        window.router.navigate('/');
        return '<div class="text-center py-12">Загрузка...</div>';
    }
    
    try {
        const user = await getUserBySlug(slug);
        
        if (!user) {
            return `
                <div class="text-center py-12">
                    <h2 class="text-2xl font-bold text-red-400">Пользователь не найден</h2>
                    <a href="/" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Вернуться на главную</a>
                </div>
            `;
        }
        
        let articles = [];
        try {
            const articlesData = await getUserArticles(user._id);
            articles = articlesData.articles || [];
        } catch (error) {
            console.error('Error loading articles:', error);
        }
        
        const publishedArticles = articles.filter(a => a.status === 'published');
        currentUser = user;
        currentArticles = publishedArticles;
        currentPage = 1;
        
        setTimeout(() => {
            renderUserProfilePage(currentUser, currentArticles);
        }, 0);
        
        return `
            <div id="user-profile-content" class="mx-auto">
                <div class="text-center py-12">Загрузка профиля...</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading user profile:', error);
        return `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold text-red-400">Ошибка загрузки профиля</h2>
                <a href="/" class="mt-4 inline-block px-4 py-2 bg-blue-600 rounded-lg">Вернуться на главную</a>
            </div>
        `;
    }
}