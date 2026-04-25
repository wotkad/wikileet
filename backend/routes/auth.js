const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
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
        
        // Настройки cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // В разработке false
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
            path: '/', // Доступна для всего сайта
        });
        
        res.json({ 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                role: user.role 
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
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Настройки cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // В разработке false
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
            path: '/',
        });
        
        res.json({ 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                role: user.role 
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
        
        console.log('Cookie token:', token ? 'present' : 'not present');
        
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