import { getAvailableHotkeys, formatHotkey, isMac } from '../utils/hotkeys.js';
import { getState } from '../state.js';

// Функция для рендеринга иконки информации с подсказкой
export function renderHotkeysInfo() {
    return `
        <div class="relative inline-block">
            <button id="hotkeys-info-btn" class="p-1 text-gray-400 hover:text-gray-200 transition rounded-full" title="Горячие клавиши">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </button>
            <div id="hotkeys-info-tooltip" class="hidden fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[280px]">
                <div class="text-sm font-semibold mb-4 text-gray-300 pb-3 border-b border-gray-700">Горячие клавиши</div>
                <div class="space-y-2" id="hotkeys-list"></div>
            </div>
        </div>
    `;
}

// Функция для обновления списка горячих клавиш в подсказке
export function updateHotkeysTooltip(user, isOnArticlePage = false) {
    const tooltip = document.getElementById('hotkeys-info-tooltip');
    const listContainer = document.getElementById('hotkeys-list');
    
    if (!tooltip || !listContainer) return;
    
    const availableHotkeys = getAvailableHotkeys(user, isOnArticlePage);
    
    if (availableHotkeys.length === 0) {
        listContainer.innerHTML = '<div class="text-gray-500 text-xs">Нет доступных комбинаций</div>';
        return;
    }
    
    listContainer.innerHTML = availableHotkeys.map(hotkey => {
        let actionText = '';
        switch (hotkey.action) {
            case 'focusSearch': actionText = 'Поиск по статьям'; break;
            case 'newArticle': actionText = 'Создать новую статью'; break;
            case 'editArticle': actionText = 'Редактировать статью'; break;
            default: actionText = hotkey.description;
        }
        
        return `
            <div class="flex justify-between items-center text-sm">
                <span class="text-gray-400">${actionText}</span>
                <kbd class="flex items-center gap-[6px] px-2 pt-0.5 pb-px bg-gray-800 rounded text-xs font-mono text-blue-400">${hotkey.displayKey}</kbd>
            </div>
        `;
    }).join('');
}

// Функция для инициализации подсказки
export function initHotkeysInfo(user, isOnArticlePage = false) {
    const btn = document.getElementById('hotkeys-info-btn');
    const tooltip = document.getElementById('hotkeys-info-tooltip');
    
    if (!btn || !tooltip) return;
    
    let hideTimeout;
    let isHovering = false;
    
    // Обновляем содержимое подсказки
    updateHotkeysTooltip(user, isOnArticlePage);
    
    const showTooltip = () => {
        clearTimeout(hideTimeout);
        const rect = btn.getBoundingClientRect();
        tooltip.classList.remove('hidden');
        tooltip.style.left = `${rect.left - 200}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;
        
        // Проверяем, не выходит ли за пределы экрана
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
        }
        if (tooltipRect.bottom > window.innerHeight) {
            tooltip.style.top = `${rect.top - tooltipRect.height - 5}px`;
        }
    };
    
    const hideTooltip = () => {
        if (!isHovering) {
            hideTimeout = setTimeout(() => {
                tooltip.classList.add('hidden');
            }, 300);
        }
    };
    
    btn.addEventListener('mouseenter', showTooltip);
    btn.addEventListener('mouseleave', hideTooltip);
    
    tooltip.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        isHovering = true;
    });
    
    tooltip.addEventListener('mouseleave', () => {
        isHovering = false;
        hideTooltip();
    });
}