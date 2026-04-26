const express = require('express');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Временное хранилище просмотров
const viewedArticles = new Map();

// GET /api/articles - получение статей с фильтрацией
router.get('/', async (req, res) => {
    try {
        const {
            search,
            categorySlug,
            tagSlugs,
            dateFrom,
            dateTo,
            sort = '-createdAt',
            page = 1,
            limit = 10,
        } = req.query;

        const query = {};

        // Поиск только по title и description (исключаем content)
        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Фильтр по категории (по slug)
        if (categorySlug && categorySlug.trim()) {
            const category = await Category.findOne({ slug: categorySlug });
            if (category) {
                query.category = category._id;
            }
        }

        // Фильтр по тегам (по slugs) - исключающий (должны быть ВСЕ выбранные теги)
        if (tagSlugs && tagSlugs.trim()) {
            const tagSlugsArray = tagSlugs.split(',').filter(s => s.trim());
            const tags = await Tag.find({ slug: { $in: tagSlugsArray } });
            const tagIds = tags.map(t => t._id);
            
            if (tagIds.length > 0) {
                query.tags = { $all: tagIds };
            }
        }

        // Фильтр по дате
        if (dateFrom) {
            query.createdAt = { $gte: new Date(dateFrom) };
        }
        if (dateTo) {
            query.createdAt = { ...query.createdAt, $lte: new Date(dateTo) };
        }

        console.log('MongoDB query:', JSON.stringify(query, null, 2));

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const articles = await Article.find(query)
            .populate('category')
            .populate('tags')
            .populate('author', 'name email')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Article.countDocuments(query);

        res.json({
            articles,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total,
        });
    } catch (error) {
        console.error('Error in GET /articles:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/articles/:slug - получение одной статьи с умным счетчиком просмотров
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const clientIp = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const sessionKey = `${clientIp}_${userAgent}_${slug}`;
        
        const article = await Article.findOne({ slug })
            .populate('category')
            .populate('tags')
            .populate('author', 'name email');
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        const lastViewTime = viewedArticles.get(sessionKey);
        const now = Date.now();
        
        if (!lastViewTime || (now - lastViewTime) > 24 * 60 * 60 * 1000) {
            article.views += 1;
            await article.save();
            viewedArticles.set(sessionKey, now);
        }

        // Похожие статьи (по тегам и категории)
        const similar = await Article.find({
            $or: [
                { category: article.category._id },
                { tags: { $in: article.tags } },
            ],
            _id: { $ne: article._id },
        })
            .limit(5)
            .populate('category')
            .populate('tags');

        res.json({ article, similar });
    } catch (error) {
        console.error('Error in GET /articles/:slug:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/articles - создание статьи (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, slug, content, description, category, tags } = req.body;
        
        if (!title || !slug || !content || !description || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const existingArticle = await Article.findOne({ slug });
        if (existingArticle) {
            return res.status(400).json({ error: 'Article with this slug already exists' });
        }
        
        const article = new Article({
            title,
            slug,
            content,
            description,
            category,
            tags: tags || [],
            author: req.userId,
        });
        
        await article.save();
        await article.populate('category');
        await article.populate('tags');
        
        res.status(201).json(article);
    } catch (error) {
        console.error('Error in POST /articles:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/articles/:id - обновление статьи (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const article = await Article.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        await article.populate('category');
        await article.populate('tags');
        
        res.json(article);
    } catch (error) {
        console.error('Error in PUT /articles/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/articles/:id - удаление статьи (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Deleting article with ID:', id);
        
        const article = await Article.findByIdAndDelete(id);
        
        if (!article) {
            console.log('Article not found with ID:', id);
            return res.status(404).json({ error: 'Article not found' });
        }
        
        console.log('Article deleted successfully:', article.title);
        
        res.json({ 
            message: 'Article deleted successfully',
            deletedArticle: { id: article._id, title: article.title, slug: article.slug }
        });
    } catch (error) {
        console.error('Error in DELETE /articles/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;