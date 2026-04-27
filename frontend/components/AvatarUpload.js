import { updateHeaderUser } from './Header.js';

export function initAvatarUpload() {
    console.log('initAvatarUpload called - setting up direct event listeners');
    
    const uploadBtn = document.getElementById('upload-avatar-btn');
    const fileInput = document.getElementById('avatar-input');
    const removeBtn = document.getElementById('remove-avatar-btn');
    
    if (!uploadBtn) {
        console.log('Upload button not found, elements may not be ready yet');
        return;
    }
    
    console.log('Found elements, attaching listeners');
    
    // Убираем старые обработчики
    const newUploadBtn = uploadBtn.cloneNode(true);
    uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
    
    newUploadBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Upload button clicked');
        const input = document.getElementById('avatar-input');
        if (input) {
            input.click();
        }
    };
    
    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        newFileInput.onchange = async (e) => {
            const file = e.target.files[0];
            console.log('File selected:', file?.name);
            
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                window.toast?.error('Please select an image file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                window.toast?.error('File size must be less than 5MB');
                return;
            }
            
            // Превью
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('avatar-preview');
                if (preview) {
                    preview.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
            
            const formData = new FormData();
            formData.append('avatar', file);
            
            try {
                const response = await fetch('/api/profile/avatar', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Upload failed');
                }
                
                const data = await response.json();
                console.log('Upload success:', data);
                
                // Обновляем превью
                const newAvatarUrl = `/api/profile/avatar/${data.avatar}?t=${Date.now()}`;
                const preview = document.getElementById('avatar-preview');
                if (preview) {
                    preview.src = newAvatarUrl;
                }
                
                // Обновляем состояние
                const { getState, setState } = await import('../state.js');
                const state = getState();
                if (state.currentUser) {
                    state.currentUser.avatar = data.avatar;
                    setState({ currentUser: state.currentUser });
                }
                
                updateHeaderUser();
                window.toast?.success('Avatar updated successfully!');
                
                // Показываем кнопку удаления
                const removeBtnElement = document.getElementById('remove-avatar-btn');
                if (removeBtnElement) {
                    removeBtnElement.classList.remove('hidden');
                }
                
                newFileInput.value = '';
            } catch (error) {
                console.error('Upload error:', error);
                window.toast?.error(error.message);
            }
        };
    }
    
    if (removeBtn) {
        const newRemoveBtn = removeBtn.cloneNode(true);
        removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
        
        newRemoveBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Remove button clicked');
            
            try {
                const response = await fetch('/api/profile/avatar', {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Delete failed');
                }
                
                console.log('Delete success');
                
                // Обновляем превью на дефолтный
                const preview = document.getElementById('avatar-preview');
                if (preview) {
                    preview.src = '/api/profile/avatar/default-avatar.png?t=' + Date.now();
                }
                
                // Обновляем состояние
                const { getState, setState } = await import('../state.js');
                const state = getState();
                if (state.currentUser) {
                    state.currentUser.avatar = null;
                    setState({ currentUser: state.currentUser });
                }
                
                updateHeaderUser();
                window.toast?.success('Avatar removed successfully!');
                newRemoveBtn.classList.add('hidden');
            } catch (error) {
                console.error('Delete error:', error);
                window.toast?.error(error.message);
            }
        };
    }
}