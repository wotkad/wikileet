import { login } from '../auth.js';
import router from '../router.js';

export default function LoginPage() {
    setTimeout(initLoginForm, 0);

    return `
        <div class="max-w-md mx-auto">
            <div class="bg-gray-800 rounded-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>

                <form id="loginForm" class="space-y-4">
                    <input id="email" placeholder="Email" class="w-full p-2" />
                    <input id="password" type="password" placeholder="Password" class="w-full p-2" />

                    <button type="submit" class="w-full bg-blue-600 p-2">
                        Login
                    </button>
                </form>
            </div>
        </div>
    `;
}

function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await login(email, password);
            router.navigate('/');
        } catch (err) {
            alert(err.message);
        }
    });
}