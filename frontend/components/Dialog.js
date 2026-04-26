// Компонент диалоговых окон
export function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Удаляем существующий диалог если есть
        const existingDialog = document.getElementById('confirm-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        const dialog = document.createElement('div');
        dialog.id = 'confirm-dialog';
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all">
                <h3 class="text-xl font-bold mb-2">${escapeHtml(title)}</h3>
                <p class="text-gray-400 mb-6 whitespace-pre-wrap">${escapeHtml(message)}</p>
                <div class="flex gap-3 justify-end">
                    <button id="confirm-cancel" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button id="confirm-ok" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition">
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const cancelBtn = dialog.querySelector('#confirm-cancel');
        const okBtn = dialog.querySelector('#confirm-ok');
        
        const closeDialog = (result) => {
            dialog.classList.add('opacity-0');
            setTimeout(() => {
                if (dialog.parentNode) {
                    dialog.remove();
                }
                resolve(result);
            }, 200);
        };
        
        cancelBtn.onclick = () => closeDialog(false);
        okBtn.onclick = () => closeDialog(true);
        
        // Клик вне диалога
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                closeDialog(false);
            }
        };
    });
}

export function showAlertDialog(title, message, buttonText = 'OK') {
    return new Promise((resolve) => {
        const existingDialog = document.getElementById('alert-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        const dialog = document.createElement('div');
        dialog.id = 'alert-dialog';
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all">
                <h3 class="text-xl font-bold mb-2">${escapeHtml(title)}</h3>
                <p class="text-gray-400 mb-6">${escapeHtml(message)}</p>
                <div class="flex justify-end">
                    <button id="alert-ok" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                        ${escapeHtml(buttonText)}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const okBtn = dialog.querySelector('#alert-ok');
        
        const closeDialog = () => {
            dialog.classList.add('opacity-0');
            setTimeout(() => {
                if (dialog.parentNode) {
                    dialog.remove();
                }
                resolve();
            }, 200);
        };
        
        okBtn.onclick = () => closeDialog();
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        };
    });
}