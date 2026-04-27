const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // Добавляем импорт jwt

dotenv.config();

const app = express();

// CORS настройки
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

// Middleware для проверки токена и добавления userRole в req
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userRole = decoded.role;
            req.userId = decoded.userId;
            console.log('User role:', req.userRole, 'for path:', req.path);
        } catch (error) {
            console.log('Invalid token:', error.message);
        }
    }
    next();
});

const frontendPath = path.join(__dirname, '../frontend');

// Раздача статических файлов frontend
app.use(express.static(frontendPath));

// API маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/profile', require('./routes/profile'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// SPA fallback
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    // Пропускаем статические файлы с расширениями
    const staticExtensions = /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/;
    if (staticExtensions.test(req.path)) {
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