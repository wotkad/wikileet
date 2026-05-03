import { getUserBySlug, getUserArticles } from '../api.js';
import { escapeHtml, formatDate } from '../utils/utils.js';
import ArticleCard from '../components/ArticleCard.js';
import { renderPagination, attachPaginationEvents } from '../components/Pagination.js';
import { PAGINATION, UPLOAD, USER_ROLES, USER_ROLES_TITLE, USER_ROLES_CLASS } from '../constants.js';
import { getState } from '../state.js';
import { showConfirmDialog } from '../components/Dialog.js';

let currentPage = 1;
let currentUser = null;
let currentArticles = [];

function onPageChange(page) {
    currentPage = page;
    renderUserProfilePage(currentUser, currentArticles);
}

// Функция для изменения роли пользователя
async function changeUserRole(userId, newRole, userName) {
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
        
        let roleDisplay = '';
        if (newRole === USER_ROLES.ADMIN) roleDisplay = 'Администратора';
        else if (newRole === USER_ROLES.SUPERADMIN) roleDisplay = 'СуперАдмина';
        else roleDisplay = 'Пользователя';
        
        window.toast?.success(`Роль пользователя ${userName} изменена на ${roleDisplay}`);
        
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
    
    // Нельзя менять свою роль
    if (loggedInUser._id === targetUser._id) return false;
    
    // Нельзя менять роль суперадмина (никто не может)
    if (targetUser.role === USER_ROLES.SUPERADMIN) return false;
    
    // Суперадмин может менять роли admin и user
    if (loggedInUser.role === USER_ROLES.SUPERADMIN) {
        return true;
    }
    
    // Админ может менять роли только у обычных пользователей
    if (loggedInUser.role === USER_ROLES.ADMIN) {
        // Админ не может менять роль другого админа
        if (targetUser.role === USER_ROLES.ADMIN) return false;
        // Админ не может менять роль суперадмина
        if (targetUser.role === USER_ROLES.SUPERADMIN) return false;
        // Админ может менять роль только у обычных пользователей
        return targetUser.role === USER_ROLES.USER;
    }
    
    return false;
}

// Функция для получения доступных опций ролей
function getAvailableRoles(targetUser, loggedInUser) {
    const roles = [];
    
    if (loggedInUser.role === USER_ROLES.SUPERADMIN) {
        // Суперадмин может назначать user и admin
        roles.push({ value: USER_ROLES.USER, label: USER_ROLES_TITLE.user });
        roles.push({ value: USER_ROLES.ADMIN, label: USER_ROLES_TITLE.admin });
    } else if (loggedInUser.role === USER_ROLES.ADMIN) {
        // Админ может менять роли у обычных пользователей
        roles.push({ value: USER_ROLES.USER, label: USER_ROLES_TITLE.user });
        roles.push({ value: USER_ROLES.ADMIN, label: USER_ROLES_TITLE.admin });
    }
    
    return roles;
}

// Функция для отображения выпадающего списка ролей
function renderRoleSelector(user) {
    const state = getState();
    const loggedInUser = state.currentUser;
    const canEdit = canEditRoles(user);
    
    const roleDisplay = USER_ROLES_TITLE[user.role] || USER_ROLES_TITLE.user;
    const roleBadgeClass = USER_ROLES_CLASS[user.role] || USER_ROLES_CLASS.user;
    
    if (!canEdit) {
        return `
            <span class="px-3 py-1 ${roleBadgeClass} rounded-full text-sm">
                ${roleDisplay}
            </span>
        `;
    }
    
    const availableRoles = getAvailableRoles(user, loggedInUser);
    
    return `
        <div class="relative inline-block">
            <select id="role-select" class="px-3 py-1 bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                ${availableRoles.map(role => `
                    <option value="${role.value}" ${user.role === role.value ? 'selected' : ''}>
                        ${role.label}
                    </option>
                `).join('')}
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
                <h2 class="text-2xl font-bold mb-4">📝 Статьи ${escapeHtml(user.name)}</h2>
                <div class="space-y-4">
                    ${paginatedArticles.length > 0 ? 
                        paginatedArticles.map(article => ArticleCard(article)).join('') : 
                        '<div class="text-center py-8 text-gray-400">Статей ещё нет</div>'
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
            const roleName = newRole === USER_ROLES.ADMIN ? 'Администратора' : 'Пользователя';
            const currentRoleName = user.role === USER_ROLES.ADMIN ? 'Администратора' : 'Пользователя';
            
            // Используем showConfirmDialog из Dialog.js
            const confirmed = await showConfirmDialog(
                'Подтверждение смены роли',
                `Вы уверены, что хотите изменить роль пользователя "${user.name}" с ${currentRoleName} на ${roleName}?`,
                'Да, изменить',
                'Отмена'
            );
            
            if (confirmed) {
                await changeUserRole(user._id, newRole, user.name);
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