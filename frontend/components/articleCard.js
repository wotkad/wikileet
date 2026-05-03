import { escapeHtml, calculateReadTime, truncateText, formatDate, getMinutesDeclension, getViewsDeclension } from '../utils/utils.js';
import { DISPLAY, UPLOAD } from '../constants.js';
import { getState } from '../state.js';
import FavoriteButton from './FavoriteButton.js';

async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        window.toast?.success(message);
    } catch (err) {
        console.error('Ошибка копирования:', err);
        window.toast?.error('Не удалось скопировать ссылку');
    }
}

function hasMediaInContent(content) {
    if (!content) return { hasImage: false, hasVideo: false };
    
    const imagePatterns = [
        /<img[^>]+src=["'][^"']+["']/gi,
        /\.(jpg|jpeg|png|gif|webp|svg)/gi,
        /\/api\/media\/file\/[^"'\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi
    ];
    
    const videoPatterns = [
        /<video[^>]*>[\s\S]*?<\/video>/gi,
        /<source[^>]+src=["'][^"']+\.(mp4|webm|mov|ogg)[^"']*["']/gi,
        /\.(mp4|webm|mov|ogg)/gi,
        /\/api\/media\/file\/[^"'\s)]+\.(mp4|webm|mov)/gi
    ];
    
    let hasImage = false;
    let hasVideo = false;
    
    for (const pattern of imagePatterns) {
        if (pattern.test(content)) {
            hasImage = true;
            break;
        }
    }
    
    for (const pattern of videoPatterns) {
        if (pattern.test(content)) {
            hasVideo = true;
            break;
        }
    }
    
    return { hasImage, hasVideo };
}

function getMediaIcon(hasImage, hasVideo) {
    if (hasImage && hasVideo) {
        return {
            icon: '🎬📷',
            title: 'Содержит изображения и видео',
            class: 'bg-purple-900 text-purple-300'
        };
    } else if (hasVideo) {
        return {
            icon: '🎬',
            title: 'Содержит видео',
            class: 'bg-red-900 text-red-300'
        };
    } else if (hasImage) {
        return {
            icon: '📷',
            title: 'Содержит изображения',
            class: 'bg-green-900 text-green-300'
        };
    }
    return null;
}

export default function ArticleCard(article) {
    const readTime = article.readTime || calculateReadTime(article.content);
    const author = article.author || {};
    const authorAvatar = author.avatar ? `/api/profile/avatar/${author.avatar}` : UPLOAD.DEFAULT_AVATAR;
    const authorName = author.name || author.email || 'Нет автора';
    const authorSlug = author.slug;
    
    const hasValidAuthor = authorSlug && authorName !== 'Нет автора';
    const visibleTags = article.tags?.slice(0, DISPLAY.MAX_TAGS_IN_CARD) || [];
    
    const state = getState();
    const currentUser = state.currentUser;
    const isLoggedIn = !!currentUser;
    const articleUrl = `${window.location.origin}/wiki/${article.slug}`;
    const readTimeText = getMinutesDeclension(readTime);
    const viewsText = getViewsDeclension(article.views);
    
    const { hasImage, hasVideo } = hasMediaInContent(article.content);
    const mediaIcon = getMediaIcon(hasImage, hasVideo);
    
    return `
        <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition relative group">
            <div class="absolute top-2 right-2 z-10 flex gap-1">
                <button class="copy-btn p-1 rounded-full transition text-gray-500 hover:text-green-400" data-url="${articleUrl}" data-title="${escapeHtml(article.title)}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                </button>
                ${isLoggedIn ? FavoriteButton(article._id) : ''}
            </div>
            
            <a href="/wiki/${article.slug}" class="block">
                <h3 class="text-lg font-semibold mb-2 pr-16">${escapeHtml(article.title)}</h3>
                <p class="text-gray-400 text-sm mb-3">${truncateText(escapeHtml(article.description || 'Нет описания'), DISPLAY.TRUNCATE_DESCRIPTION_LENGTH)}</p>
            </a>
            
            <div class="flex flex-wrap items-center gap-2 text-xs">
                <a href="/wiki?category=${article.category?.slug}" class="px-2 py-1 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition">
                    ${escapeHtml(article.category?.name || 'Без категории')}
                </a>
                ${visibleTags.map(tag => `
                    <a href="/wiki?tags=${tag.slug}" class="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition">
                        ${escapeHtml(tag.name)}
                    </a>
                `).join('')}
                ${article.tags?.length > DISPLAY.MAX_TAGS_IN_CARD ? `
                    <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        +${article.tags.length - DISPLAY.MAX_TAGS_IN_CARD}
                    </span>
                ` : ''}
                
                ${mediaIcon ? `
                    <span class="px-2 py-1 ${mediaIcon.class} rounded flex items-center gap-1" title="${mediaIcon.title}">
                        <span>${mediaIcon.icon}</span>
                    </span>
                ` : ''}
                
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">👁️ ${viewsText}</span>
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">⏱️ ${readTimeText}</span>
                ${hasValidAuthor ? `
                    <a href="/profile/${authorSlug}" class="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition">
                        <img src="${authorAvatar}" alt="${escapeHtml(authorName)}" class="w-4 h-4 rounded-full object-cover">
                        <span>${escapeHtml(authorName)}</span>
                    </a>
                ` : `
                    <div class="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded">
                        <img src="${authorAvatar}" alt="${escapeHtml(authorName)}" class="w-4 h-4 rounded-full object-cover">
                        <span>${escapeHtml(authorName)}</span>
                    </div>
                `}
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded">📅 ${formatDate(article.createdAt)}</span>
            </div>
        </div>
    `;
}

document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.copy-btn');
    if (!copyBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const url = copyBtn.dataset.url;
    const title = copyBtn.dataset.title;
    
    if (url) {
        await copyToClipboard(url, `Ссылка на "${title}" скопирована!`);
    }
});