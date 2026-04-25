import Header from './Header.js';
import Sidebar from './Sidebar.js';

export default function Layout(content) {
    return `
        ${Header()}
        <div class="flex flex-1 overflow-hidden">
            ${Sidebar()}
            <main class="flex-1">
                <div class="main-content-area overflow-y-auto p-4" style="height: calc(100vh - 64px);">
                    ${content}
                </div>
            </main>
        </div>
    `;
}