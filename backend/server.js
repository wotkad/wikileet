const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const frontendPath = path.join(__dirname, '../frontend');

app.use(express.static(frontendPath));

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
                me: 'GET /api/auth/me'
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

app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

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