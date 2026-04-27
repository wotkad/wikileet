// Toast notification system
import { escapeHtml } from '../utils/utils.js';

class Toast {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.createContainer();
    }

    createContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
            this.container = container;
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    show(message, type = 'info', duration = 3000) {
        const id = Date.now();
        const toast = this.createToast(message, type, id);
        
        this.container.appendChild(toast);
        this.toasts.push({ id, element: toast });
        
        setTimeout(() => {
            this.remove(id);
        }, duration);
        
        return id;
    }

    createToast(message, type, id) {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.id = `toast-${id}`;
        toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0`;
        toast.innerHTML = `
            <span class="text-xl font-bold">${icons[type]}</span>
            <span class="flex-1">${escapeHtml(message)}</span>
            <button class="toast-close hover:text-gray-200 transition">×</button>
        `;
        
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        }, 10);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(id);
        });
        
        return toast;
    }

    remove(id) {
        const toast = this.toasts.find(t => t.id === id);
        if (toast) {
            toast.element.classList.remove('translate-x-0', 'opacity-100');
            toast.element.classList.add('translate-x-full', 'opacity-0');
            
            setTimeout(() => {
                if (toast.element.parentNode) {
                    toast.element.parentNode.removeChild(toast.element);
                }
                this.toasts = this.toasts.filter(t => t.id !== id);
            }, 300);
        }
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.toast = new Toast();
}

export default window.toast;