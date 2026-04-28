const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { upload, processAndSaveAvatar, deleteAvatar, getDefaultAvatarPath } = require('../middleware/upload');

const router = express.Router();

// Обновление профиля (имя, email)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.userId;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email.toLowerCase();
        
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Смена пароля
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        
        console.log('Change password request for user ID:', userId);
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Проверяем текущий пароль
        const isMatch = await user.comparePassword(currentPassword);
        console.log('Current password match:', isMatch);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Устанавливаем новый пароль (хеширование произойдет в pre-save hook)
        user.password = newPassword;
        await user.save();
        
        console.log('Password changed successfully for user:', user.email);
        
        // Создаем новый токен
        const newToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Обновляем cookie с новым токеном
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        
        res.json({ 
            message: 'Password changed successfully',
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: error.message });
    }
});

// Обновление профиля (имя, email)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.userId;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email.toLowerCase();
        
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Загрузка аватара
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Обрабатываем и сохраняем аватар
        const avatarFileName = await processAndSaveAvatar(req.file, user.avatar);
        
        // Обновляем пользователя
        user.avatar = avatarFileName;
        await user.save();
        
        res.json({ 
            message: 'Avatar uploaded successfully',
            avatar: avatarFileName 
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: error.message });
    }
});

// Удаление аватара
router.delete('/avatar', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.avatar) {
            await deleteAvatar(user.avatar);
            user.avatar = null;
            await user.save();
        }
        
        res.json({ message: 'Avatar deleted successfully' });
    } catch (error) {
        console.error('Error deleting avatar:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получение аватара
router.get('/avatar/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const avatarsDir = path.join(__dirname, '../../uploads/avatars');
        const avatarPath = path.join(avatarsDir, filename);
        
        // Проверяем существует ли файл
        if (!fs.existsSync(avatarPath)) {
            // Возвращаем default аватар
            const defaultAvatar = getDefaultAvatarPath();
            if (fs.existsSync(defaultAvatar)) {
                return res.sendFile(defaultAvatar);
            }
            return res.status(404).json({ error: 'Avatar not found' });
        }
        
        res.sendFile(avatarPath);
    } catch (error) {
        console.error('Error getting avatar:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получение информации о пользователе
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получение пользователя по slug (для публичного профиля)
router.get('/user/by-slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const user = await User.findOne({ slug }).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`User found: ${user.name}, role: ${user.role}`); // Для отладки
        
        res.json(user);
    } catch (error) {
        console.error('Error getting user by slug:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/profile/users - получение всех пользователей с фильтрацией
router.get('/users', async (req, res) => {
    try {
        const { search, role, sort = '-createdAt', page = 1, limit = 20 } = req.query;
        
        const query = {};
        
        // Фильтр по роли
        if (role && role !== 'all') {
            query.role = role;
        }
        
        // Поиск по имени
        if (search && search.trim()) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);
        
        const total = await User.countDocuments(query);
        
        // Для каждого пользователя получаем количество статей
        const Article = require('../models/Article');
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const articlesCount = await Article.countDocuments({ author: user._id, status: 'published' });
            const totalViews = await Article.aggregate([
                { $match: { author: user._id, status: 'published' } },
                { $group: { _id: null, total: { $sum: '$views' } } }
            ]);
            
            return {
                ...user.toObject(),
                articlesCount,
                totalViews: totalViews[0]?.total || 0
            };
        }));
        
        res.json({
            users: usersWithStats,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total,
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/profile/users/stats - получение статистики по пользователям
router.get('/users/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const userCount = await User.countDocuments({ role: 'user' });
        
        res.json({
            totalUsers,
            adminCount,
            userCount,
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;