const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Добавляем импорт jwt
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
            status,
            author,
        } = req.query;

        const query = {};

        // Определяем, админ ли пользователь
        const token = req.cookies.token;
        let isAdmin = false;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
                console.log('User is admin:', isAdmin);
            } catch (error) {
                console.log('Invalid token:', error.message);
            }
        }

        // Фильтр по статусу
        if (status && status !== 'all') {
            query.status = status;
        } else if (!status || status === 'all') {
            if (!isAdmin) {
                query.status = 'published';
            }
        }

        // Фильтр по автору
        if (author) {
            query.author = author;
        }

        // Поиск по title и description
        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Фильтр по категории
        if (categorySlug && categorySlug.trim()) {
            const category = await Category.findOne({ slug: categorySlug });
            if (category) {
                query.category = category._id;
            }
        }

        // Фильтр по тегам
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
            .populate('author', 'name email avatar')
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

router.get('/search', async (req, res) => {
    try {
        const { q, limit = 5 } = req.query;
        
        if (!q || q.length < 2) {
            return res.json([]);
        }
        
        const articles = await Article.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ],
            status: 'published'
        })
            .select('title slug description')
            .limit(parseInt(limit))
            .lean();
        
        res.json(articles);
    } catch (error) {
        console.error('Error searching articles:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users - получение списка пользователей для админа
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const User = require('../models/User');
        const users = await User.find({}, 'name email role _id').sort('name');
        res.json(users);
    } catch (error) {
        console.error('Error in GET /users:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/articles/:slug - получение одной статьи
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const clientIp = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const sessionKey = `${clientIp}_${userAgent}_${slug}`;
        
        const token = req.cookies.token;
        let isAdmin = false;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch (error) {}
        }
        
        const article = await Article.findOne({ slug })
            .populate('category')
            .populate('tags')
            .populate('author', 'name email avatar');
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        if (article.status === 'draft' && !isAdmin) {
            return res.status(404).json({ error: 'Article not found' });
        }

        if (article.status === 'published') {
            const lastViewTime = viewedArticles.get(sessionKey);
            const now = Date.now();
            
            if (!lastViewTime || (now - lastViewTime) > 24 * 60 * 60 * 1000) {
                article.views += 1;
                await article.save();
                viewedArticles.set(sessionKey, now);
            }
        }

        // Похожие статьи с полным populate автора
        const similar = await Article.find({
            $or: [
                { category: article.category._id },
                { tags: { $in: article.tags } },
            ],
            _id: { $ne: article._id },
            status: 'published',
        })
            .limit(5)
            .populate('category')
            .populate('tags')
            .populate('author', 'name email avatar'); // Добавляем populate для автора

        res.json({ article, similar });
    } catch (error) {
        console.error('Error in GET /articles/:slug:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/articles - создание статьи (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, slug, content, description, category, tags, status, publishedAt, author } = req.body;
        
        console.log('Creating article with data:', { title, slug, status, publishedAt, author });
        
        if (!title || !slug || !content || !description || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const existingArticle = await Article.findOne({ slug });
        if (existingArticle) {
            return res.status(400).json({ error: 'Article with this slug already exists' });
        }
        
        // Определяем автора
        let authorId = author || req.userId;
        
        const articleData = {
            title,
            slug,
            content,
            description,
            category,
            tags: tags || [],
            author: authorId,
        };
        
        // Обработка статуса и даты публикации
        if (status === 'published') {
            articleData.status = 'published';
            articleData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
        } else {
            articleData.status = 'draft';
        }
        
        const article = new Article(articleData);
        await article.save();
        await article.populate('category');
        await article.populate('tags');
        await article.populate('author', 'name email');
        
        console.log('Article created successfully:', article._id);
        
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
        const { title, slug, content, description, category, tags, status, publishedAt, author } = req.body;
        
        console.log('Updating article with ID:', id, 'Data:', { title, slug, status, publishedAt, author });
        
        // Рассчитываем время чтения
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        
        const updateData = {
            title,
            slug,
            content,
            description,
            category,
            tags: tags || [],
            author: author || req.userId,
            readTime,
            updatedAt: Date.now()
        };
        
        // Обработка статуса и даты публикации
        if (status === 'published') {
            updateData.status = 'published';
            if (publishedAt) {
                updateData.publishedAt = new Date(publishedAt);
            } else {
                // Если дата не указана, оставляем существующую или устанавливаем текущую
                const existingArticle = await Article.findById(id);
                updateData.publishedAt = existingArticle?.publishedAt || new Date();
            }
        } else {
            updateData.status = 'draft';
        }
        
        const article = await Article.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        await article.populate('category');
        await article.populate('tags');
        await article.populate('author', 'name email');
        
        console.log('Article updated successfully:', article._id);
        
        res.json(article);
    } catch (error) {
        console.error('Error in PUT /articles/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/articles/:id - обновление статьи (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, content, description, category, tags, status, scheduledPublishDate, author } = req.body;
        
        console.log('Updating article with ID:', id, 'Data:', { title, slug, status, scheduledPublishDate, author });
        
        // Рассчитываем время чтения
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        
        const updateData = {
            title,
            slug,
            content,
            description,
            category,
            tags: tags || [],
            author: author || req.userId,
            readTime,
            updatedAt: Date.now()
        };
        
        // Обработка статуса и даты публикации
        if (status === 'scheduled' && scheduledPublishDate) {
            updateData.status = 'scheduled';
            updateData.scheduledPublishDate = new Date(scheduledPublishDate);
            // Не меняем publishedAt
        } else if (status === 'published') {
            updateData.status = 'published';
            // Если статья была не опубликована, устанавливаем дату публикации
            const existingArticle = await Article.findById(id);
            if (existingArticle && existingArticle.status !== 'published') {
                updateData.publishedAt = Date.now();
            }
        } else {
            updateData.status = 'draft';
            updateData.scheduledPublishDate = null;
        }
        
        const article = await Article.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        await article.populate('category');
        await article.populate('tags');
        await article.populate('author', 'name email');
        
        console.log('Article updated successfully:', article._id);
        
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