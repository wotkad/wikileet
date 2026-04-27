const express = require('express');
const path = require('path');
const fs = require('fs');
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

module.exports = router;