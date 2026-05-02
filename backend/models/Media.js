const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        default: null,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    usedInArticles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Media', mediaSchema);