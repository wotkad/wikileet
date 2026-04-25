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
        
        // Создаем токен
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Устанавливаем HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // В разработке false, в production true
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
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
        
        // Создаем токен
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Устанавливаем HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // В разработке false, в production true
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
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
        sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

// Получение текущего пользователя
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;