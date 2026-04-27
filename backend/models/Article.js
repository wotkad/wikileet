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

// Индексы для поиска
articleSchema.index({ title: 'text', description: 'text' });
articleSchema.index({ status: 1 });
articleSchema.index({ publishedAt: -1 });

articleSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    
    // Если статус меняется на published и publishedAt не установлен
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = Date.now();
    }
    
    next();
});

module.exports = mongoose.model('Article', articleSchema);