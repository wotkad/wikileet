import { login } from '../api.js';
import { setAuth } from '../state.js';

export default function LoginPage() {
    return `
        <form id="loginForm">
            <input id="email" placeholder="email" />
            <input id="password" type="password" placeholder="password" />
            <button>Login</button>
        </form>
    `;
}

setTimeout(() => {
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const data = await login(email, password);

        setAuth(data.token, data.user);

        window.router.navigate('/');
    });
}, 100);