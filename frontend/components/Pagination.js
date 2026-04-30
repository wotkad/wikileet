import { DISPLAY } from '../constants.js';

export function renderPagination(currentPage, totalPages, maxVisible = DISPLAY.MAX_VISIBLE_PAGES) {
    if (!totalPages || totalPages <= 1) return '';
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    let pages = [];
    
    if (startPage > 1) {
        pages.push(`<button class="page-btn px-3 py-1 rounded bg-gray-700 hover:bg-gray-600" data-page="1">1</button>`);
        if (startPage > 2) {
            pages.push(`<span class="px-2 text-gray-500">...</span>`);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`<button class="page-btn px-3 py-1 rounded ${i === currentPage ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}" data-page="${i}">${i}</button>`);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push(`<span class="px-2 text-gray-500">...</span>`);
        }
        pages.push(`<button class="page-btn px-3 py-1 rounded bg-gray-700 hover:bg-gray-600" data-page="${totalPages}">${totalPages}</button>`);
    }
    
    return `
        <div class="flex justify-center items-center gap-2 mt-8">
            <button class="page-prev px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                    data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                &lt;
            </button>
            ${pages.join('')}
            <button class="page-next px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                    data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                &gt;
            </button>
        </div>
    `;
}

export function attachPaginationEvents(callback) {
    // Обработка кнопок страниц
    document.querySelectorAll('.page-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            const page = parseInt(newBtn.dataset.page);
            if (callback && typeof callback === 'function') {
                callback(page);
            }
        });
    });
    
    // Обработка кнопки Prev
    const prevBtn = document.querySelector('.page-prev');
    if (prevBtn && !prevBtn.disabled) {
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        newPrevBtn.addEventListener('click', () => {
            const page = parseInt(newPrevBtn.dataset.page);
            if (callback && typeof callback === 'function') {
                callback(page);
            }
        });
    }
    
    // Обработка кнопки Next
    const nextBtn = document.querySelector('.page-next');
    if (nextBtn && !nextBtn.disabled) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', () => {
            const page = parseInt(newNextBtn.dataset.page);
            if (callback && typeof callback === 'function') {
                callback(page);
            }
        });
    }
}