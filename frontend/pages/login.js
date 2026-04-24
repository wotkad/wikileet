export default function LoginPage() {
    return `
        <div class="max-w-md mx-auto">
            <div class="bg-gray-800 rounded-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
                
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" 
                               id="email" 
                               name="email"
                               required
                               placeholder="Enter your email"
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Password</label>
                        <input type="password" 
                               id="password" 
                               name="password"
                               required
                               placeholder="Enter your password"
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