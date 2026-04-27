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
            status,
            author, // Добавляем фильтр по автору
        } = req.query;

        const query = {};

        // Определяем, админ ли пользователь
        const token = req.cookies.token;
        let isAdmin = false;
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch (error) {
                // Токен невалидный
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

// GET /api/articles/:slug - получение одной статьи
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const clientIp = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const sessionKey = `${clientIp}_${userAgent}_${slug}`;
        
        // Проверяем, админ ли пользователь
        const token = req.cookies.token;
        let isAdmin = false;
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch (error) {
                // Токен невалидный, просто игнорируем
            }
        }
        
        const article = await Article.findOne({ slug })
            .populate('category')
            .populate('tags')
            .populate('author', 'name email');
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Проверяем, может ли пользователь видеть черновик
        if (article.status === 'draft' && !isAdmin) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Увеличиваем просмотры только для опубликованных статей
        if (article.status === 'published') {
            const lastViewTime = viewedArticles.get(sessionKey);
            const now = Date.now();
            
            if (!lastViewTime || (now - lastViewTime) > 24 * 60 * 60 * 1000) {
                article.views += 1;
                await article.save();
                viewedArticles.set(sessionKey, now);
            }
        }

        // Похожие статьи (только опубликованные)
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
        const { title, slug, content, description, category, tags, status } = req.body;
        
        console.log('Creating article with data:', { title, slug, description, category, tags, status });
        
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
            status: status || 'draft',
            author: req.userId,
        });
        
        await article.save();
        await article.populate('category');
        await article.populate('tags');
        
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
        const { status, title, slug, content, description, category, tags } = req.body;
        
        console.log('Updating article with ID:', id, 'Data:', { title, slug, status });
        
        // Рассчитываем время чтения
        const wordsPerMinute = 200;
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(words / wordsPerMinute));
        
        const updateData = {
            title,
            slug,
            content,
            description,
            category,
            tags: tags || [],
            readTime,
            updatedAt: Date.now()
        };
        
        // Если статус меняется на published и publishedAt не установлен
        if (status === 'published') {
            const existingArticle = await Article.findById(id);
            if (existingArticle && existingArticle.status !== 'published') {
                updateData.publishedAt = Date.now();
            }
        }
        
        if (status) {
            updateData.status = status;
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
        
        console.log('Article updated successfully:', article._id, 'Read time:', article.readTime);
        
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