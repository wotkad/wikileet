const express = require('express');
const Article = require('../models/Article');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Получение списка статей
router.get('/', async (req, res) => {
    console.log("GET /articles hit");

    try {
        const articles = await Article.find()
            .populate('category')
            .populate('tags')
            .populate('author', 'email');

        res.json(articles);
    } catch (error) {
        console.error("ARTICLES ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

// Получение одной статьи по slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const article = await Article.findOne({ slug })
            .populate('category')
            .populate('tags')
            .populate('author', 'email');
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json({ article, similar: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создание статьи
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const article = new Article({
            ...req.body,
            author: req.userId,
        });
        await article.save();
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление статьи
router.put('/update/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const article = await Article.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление статьи
router.delete('/delete/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;