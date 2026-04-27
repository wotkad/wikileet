import { login } from '../auth.js';

export default function LoginPage() {
    return `
        <div class="max-w-md mx-auto mt-20">
            <div class="bg-gray-800 rounded-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
                
                <form id="loginForm" class="space-y-4">
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
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div id="errorMsg" class="text-red-400 text-sm hidden"></div>
                    
                    <button type="submit" 
                            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                        Login
                    </button>
                </form>
                
                <p class="text-center text-sm text-gray-400 mt-4">
                    Don't have an account? 
                    <a href="/register" class="text-blue-400 hover:underline">
                        Register
                    </a>
                </p>
            </div>
        </div>
    `;
}

// Привязываем обработчик сразу после монтирования компонента
export function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    // Убираем старый обработчик
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        
        if (!email || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Please fill in all fields';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        try {
            console.log('Submitting login for:', email);
            const data = await login(email, password);
            console.log('Login successful, user:', data?.user);
            
            // Обновляем header
            const { updateHeaderUser } = await import('../components/Header.js');
            updateHeaderUser();
            
            // Переходим на главную
            window.router.navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            if (errorMsg) {
                errorMsg.textContent = 'Invalid email or password';
                errorMsg.classList.remove('hidden');
            }
        }
    };
}

// Автоматически инициализируем форму после загрузки страницы
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginForm);
    } else {
        initLoginForm();
    }
}