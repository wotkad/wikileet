const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

// Обновляем CORS для работы с куками
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

const frontendPath = path.join(__dirname, '../frontend');

// Раздача статических файлов (ДОЛЖНА быть ПЕРВОЙ)
app.use(express.static(frontendPath, {
    extensions: ['html', 'js', 'css', 'json'],
    index: false // Отключаем автоматическую отдачу index.html
}));

// API маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tags', require('./routes/tags'));

app.get('/api/info', (req, res) => {
    res.json({
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                logout: 'POST /api/auth/logout'
            },
            articles: {
                list: 'GET /api/articles',
                get: 'GET /api/articles/:slug',
                create: 'POST /api/articles (admin)',
                update: 'PUT /api/articles/:id (admin)',
                delete: 'DELETE /api/articles/:id (admin)'
            },
            categories: {
                list: 'GET /api/categories',
                create: 'POST /api/categories (admin)'
            },
            tags: {
                list: 'GET /api/tags'
            }
        }
    });
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// SPA fallback - отдаем index.html только для путей, которые не являются статическими файлами и не API
app.use((req, res, next) => {
    // Пропускаем API запросы
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    // Пропускаем запросы к статическим файлам с расширениями
    const staticExtensions = /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/;
    if (staticExtensions.test(req.path)) {
        return next();
    }
    
    // Пропускаем запросы к папке assets
    if (req.path.startsWith('/assets/')) {
        return next();
    }
    
    // Для всех остальных путей отдаем index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Обработка 404 для API
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🔥 ERROR:', err);
    res.status(500).json({
        error: err.message || 'Something went wrong!'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`💻 Frontend: http://localhost:${PORT}`);
});