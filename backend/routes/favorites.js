const express = require('express');
const User = require('../models/User');
const Article = require('../models/Article');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/favorites - получить избранные статьи пользователя (с полными данными)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'favorites',
            populate: [
                { path: 'category' },
                { path: 'tags' },
                { path: 'author', select: 'name email avatar slug' }
            ]
        });
        res.json(user?.favorites || []);
    } catch (error) {
        console.error('Ошибка получения избранного:', error);
        res.status(500).json({ error: 'Не удалось получить избранное' });
    }
});

// POST /api/favorites/:articleId - добавить статью в избранное
router.post('/:articleId', authMiddleware, async (req, res) => {
    try {
        const { articleId } = req.params;
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ error: 'Статья не найдена' });
        }

        await User.findByIdAndUpdate(req.userId, { $addToSet: { favorites: articleId } });
        
        // Возвращаем обновлённый список избранного (с populated данными)
        const updatedUser = await User.findById(req.userId).populate({
            path: 'favorites',
            populate: [
                { path: 'category' },
                { path: 'tags' },
                { path: 'author', select: 'name email avatar slug' }
            ]
        });
        
        res.json({ message: 'Статья добавлена в избранное', favorites: updatedUser.favorites });
    } catch (error) {
        console.error('Ошибка добавления в избранное:', error);
        res.status(500).json({ error: 'Не удалось добавить статью' });
    }
});

// DELETE /api/favorites/:articleId - удалить статью из избранного
router.delete('/:articleId', authMiddleware, async (req, res) => {
    try {
        const { articleId } = req.params;
        await User.findByIdAndUpdate(req.userId, { $pull: { favorites: articleId } });
        
        // Возвращаем обновлённый список избранного (с populated данными)
        const updatedUser = await User.findById(req.userId).populate({
            path: 'favorites',
            populate: [
                { path: 'category' },
                { path: 'tags' },
                { path: 'author', select: 'name email avatar slug' }
            ]
        });
        
        res.json({ message: 'Статья удалена из избранного', favorites: updatedUser.favorites });
    } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        res.status(500).json({ error: 'Не удалось удалить статью' });
    }
});

module.exports = router;