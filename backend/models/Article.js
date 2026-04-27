const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
    views: {
        type: Number,
        default: 0,
    },
    readTime: {
        type: Number,
        default: 0,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    publishedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Функция для расчета времени чтения
function calculateReadTime(content) {
    // Средняя скорость чтения: 200-250 слов в минуту
    const wordsPerMinute = 200;
    // Удаляем HTML теги и считаем слова
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    // Минимум 1 минута
    return Math.max(1, minutes);
}

// Перед сохранением рассчитываем время чтения
articleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Рассчитываем время чтения из контента
    if (this.content) {
        this.readTime = calculateReadTime(this.content);
    }
    
    // Если статус меняется на published и publishedAt не установлен
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = Date.now();
    }
    
    next();
});

// Индексы для поиска
articleSchema.index({ title: 'text', description: 'text' });
articleSchema.index({ status: 1 });
articleSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Article', articleSchema);