export default function RegisterPage() {
    return `
        <div class="max-w-md mx-auto">
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
                               placeholder="Enter your name"
                               class="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
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
                               minlength="6"
                               placeholder="At least 6 characters"
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