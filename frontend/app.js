import { initState, getState } from './state.js';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import ContentArea from './components/ContentArea.js';
import { updateHeaderUser } from './components/Header.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        console.log('App initializing...');
        await initState();
        console.log('State initialized, currentUser:', getState().currentUser);
        this.render();
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            ${Header()}
            <div class="flex flex-1 overflow-hidden">
                ${Sidebar()}
                ${ContentArea()}
            </div>
        `;
        
        // Обновляем header после рендера
        updateHeaderUser();
        
        // Инициализируем загрузку контента
        import('./components/ContentArea.js').then(module => {
            module.loadContent('home');
        });
    }
}

new App();