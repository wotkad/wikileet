import router from './router.js';
import { initState } from './state.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        await initState();
        router.init();
    }
}

new App();