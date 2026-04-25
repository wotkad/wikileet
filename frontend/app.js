import { initState } from './state.js';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import ContentArea from './components/ContentArea.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        await initState();
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
        
        // Инициализируем загрузку контента
        import('./components/ContentArea.js').then(module => {
            module.loadContent('home');
        });
    }
}

new App();