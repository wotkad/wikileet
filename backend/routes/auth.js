const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log('Registration attempt:', { name, email });
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { name }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const user = new User({ 
            name, 
            email: email.toLowerCase(), 
            password 
        });
        
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        
        res.json({ 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                role: user.role,
                avatar: user.avatar
            } 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Логин
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', { email });
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log('User found:', { id: user._id, email: user.email });
        
        // Проверяем пароль
        const isMatch = await user.comparePassword(password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Создаем токен
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Устанавливаем HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        
        console.log('Login successful, token set in cookie for user:', email);
        
        // Возвращаем пользователя
        res.json({ 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                role: user.role,
                avatar: user.avatar
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Логаут
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
    });
    res.json({ message: 'Logged out successfully' });
});

// Получение текущего пользователя
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.json(null);
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.json(null);
        }
        
        res.json(user);
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.json(null);
    }
});

module.exports = router;