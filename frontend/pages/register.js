import { register } from '../auth.js';

export default function RegisterPage() {
    return `
        <div class="max-w-md mx-auto mt-20">
            <div class="bg-gray-800 rounded-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>
                
                <form id="registerForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Name</label>
                        <input type="text" 
                               id="name" 
                               name="name"
                               required 
                               minlength="2"
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" 
                               id="email" 
                               name="email"
                               required 
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Password</label>
                        <input type="password" 
                               id="password" 
                               name="password"
                               required 
                               minlength="6"
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div id="errorMsg" class="text-red-400 text-sm hidden"></div>
                    
                    <button type="submit" 
                            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                        Register
                    </button>
                </form>
                
                <p class="text-center text-sm text-gray-400 mt-4">
                    Already have an account? 
                    <a href="/login" class="text-blue-400 hover:underline">
                        Login
                    </a>
                </p>
            </div>
        </div>
    `;
}

// Привязываем обработчик сразу после монтирования компонента
export function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    
    // Убираем старый обработчик, если есть
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        
        if (!name || !email || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Please fill in all fields';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (name.length < 2) {
            if (errorMsg) {
                errorMsg.textContent = 'Name must be at least 2 characters';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (password.length < 6) {
            if (errorMsg) {
                errorMsg.textContent = 'Password must be at least 6 characters';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        try {
            const data = await register(name, email, password);
            if (data && data.user) {
                // Обновляем header
                const { updateHeaderUser } = await import('../components/Header.js');
                updateHeaderUser();
                // Переходим на главную
                window.router.navigate('/');
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Registration failed';
                errorMsg.classList.remove('hidden');
            }
        }
    };
}

// Автоматически инициализируем форму после загрузки страницы
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRegisterForm);
    } else {
        initRegisterForm();
    }
}