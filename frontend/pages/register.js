import { register } from '../api.js';
import { setAuth } from '../state.js';

export default function RegisterPage() {
    return `
        <form id="registerForm">
            <input id="email" placeholder="email" />
            <input id="password" type="password" placeholder="password" />
            <button>Register</button>
        </form>
    `;
}

setTimeout(() => {
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const data = await register(email, password);

        setAuth(data.token, data.user);

        window.router.navigate('/');
    });
}, 100);