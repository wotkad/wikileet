const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Media = require('../models/Media');
const { updateMediaUsage } = require('../middleware/mediaUsage');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Временное хранилище просмотров
const viewedArticles = new Map();

// Функция для проверки наличия медиа в контенте
function hasMediaInContent(content) {
    if (!content) return { hasImage: false, hasVideo: false };
    
    const imagePatterns = [
        /<img[^>]+src=["'][^"']+["']/gi,
        /\/api\/media\/file\/[^"'\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi
    ];
    
    const videoPatterns = [
        /<video[^>]*>[\s\S]*?<\/video>/gi,
        /\/api\/media\/file\/[^"'\s)]+\.(mp4|webm|mov|ogg)/gi
    ];
    
    let hasImage = false;
    let hasVideo = false;
    
    for (const pattern of imagePatterns) {
        if (pattern.test(content)) {
            hasImage = true;
            break;
        }
    }
    
    for (const pattern of videoPatterns) {
        if (pattern.test(content)) {
            hasVideo = true;
            break;
        }
    }
    
    return { hasImage, hasVideo };
}

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
            hasMedia  // '', 'image', 'video'
        } = req.query;

        const query = {};

        // Всегда показываем только опубликованные статьи
        query.status = 'published';

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
        console.log('hasMedia filter:', hasMedia);

        // Получаем все статьи без пагинации для фильтрации по медиа
        let allArticles = await Article.find(query)
            .populate('category')
            .populate('tags')
            .populate('author', 'name email avatar')
            .lean();

        console.log(`Found ${allArticles.length} articles before media filter`);

        // Добавляем информацию о медиа и фильтруем
        let filteredArticles = allArticles.map(article => {
            const { hasImage, hasVideo } = hasMediaInContent(article.content);
            return {
                ...article,
                hasImage,
                hasVideo
            };
        });

        // Применяем фильтр по медиа
        if (hasMedia === 'image') {
            filteredArticles = filteredArticles.filter(article => article.hasImage === true);
            console.log(`After image filter: ${filteredArticles.length} articles`);
        } else if (hasMedia === 'video') {
            filteredArticles = filteredArticles.filter(article => article.hasVideo === true);
            console.log(`After video filter: ${filteredArticles.length} articles`);
        }

        // Применяем сортировку
        if (sort === 'title') {
            filteredArticles.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === '-title') {
            filteredArticles.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sort === 'createdAt') {
            filteredArticles.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === '-createdAt') {
            filteredArticles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sort === '-views') {
            filteredArticles.sort((a, b) => b.views - a.views);
        } else if (sort === 'readTime') {
            filteredArticles.sort((a, b) => a.readTime - b.readTime);
        } else if (sort === '-readTime') {
            filteredArticles.sort((a, b) => b.readTime - a.readTime);
        }

        // Пагинация
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
        const total = filteredArticles.length;
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            articles: paginatedArticles,
            totalPages,
            currentPage: pageNum,
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
        
        // Всегда ищем только в опубликованных статьях
        const articles = await Article.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ],
            status: 'published'
        })
            .select('title slug description content')
            .limit(parseInt(limit))
            .lean();
        
        // Добавляем информацию о медиа
        const articlesWithMedia = articles.map(article => {
            const { hasImage, hasVideo } = hasMediaInContent(article.content);
            return {
                ...article,
                hasImage,
                hasVideo
            };
        });
        
        res.json(articlesWithMedia);
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
        
        const article = await Article.findOne({ slug, status: 'published' })
            .populate('category')
            .populate('tags')
            .populate('author', 'name email avatar');
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Увеличиваем счетчик просмотров
        const lastViewTime = viewedArticles.get(sessionKey);
        const now = Date.now();
        
        if (!lastViewTime || (now - lastViewTime) > 24 * 60 * 60 * 1000) {
            article.views += 1;
            await article.save();
            viewedArticles.set(sessionKey, now);
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
            .populate('tags')
            .populate('author', 'name email avatar');

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
        
        if (!title || !slug || !content || !description || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const existingArticle = await Article.findOne({ slug });
        if (existingArticle) {
            return res.status(400).json({ error: 'Article with this slug already exists' });
        }
        
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        
        let authorId = author || req.userId;
        
        const articleData = {
            title,
            slug,
            content,
            description,
            category,
            tags: tags || [],
            author: authorId,
            readTime,
        };
        
        if (status === 'published') {
            articleData.status = 'published';
            articleData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
        } else {
            articleData.status = 'draft';
        }
        
        const article = new Article(articleData);
        await article.save();
        
        await updateMediaUsage(article._id.toString(), content);
        
        await article.populate('category');
        await article.populate('tags');
        await article.populate('author', 'name email');
        
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
        
        if (status === 'published') {
            updateData.status = 'published';
            if (publishedAt) {
                updateData.publishedAt = new Date(publishedAt);
            } else {
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
        
        await updateMediaUsage(article._id.toString(), content);
        
        await article.populate('category');
        await article.populate('tags');
        await article.populate('author', 'name email');
        
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
        
        await Media.updateMany(
            { usedInArticles: id },
            { $pull: { usedInArticles: id } }
        );
        
        const article = await Article.findByIdAndDelete(id);
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
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