const express = require('express');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload, mediaDir } = require('../middleware/uploadMedia');

const router = express.Router();

// GET /api/media - получить список всех медиафайлов
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        const query = {};
        
        if (type && type !== 'all') {
            query.type = type;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const media = await Media.find(query)
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip)
            .populate('uploadedBy', 'name email');
        
        const total = await Media.countDocuments(query);
        
        res.json({
            media,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            total,
        });
    } catch (error) {
        console.error('Error getting media:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/media/file/:filename - получение файла (как аватары)
router.get('/file/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(mediaDir, filename);
        
        console.log('Looking for file:', filePath);
        
        // Проверяем существует ли файл
        if (!fs.existsSync(filePath)) {
            console.log('File not found:', filePath);
            return res.status(404).json({ error: 'File not found' });
        }
        
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error getting file:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/media/upload - загрузка медиафайла
router.post('/upload', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const file = req.file;
        const mimeType = file.mimetype;
        const type = mimeType.startsWith('image/') ? 'image' : 'video';
        
        // Формируем URL для доступа к файлу через API
        const fileUrl = `/api/media/file/${file.filename}`;
        
        const media = new Media({
            filename: file.filename,
            originalName: file.originalname,
            type: type,
            mimeType: mimeType,
            size: file.size,
            url: fileUrl,
            uploadedBy: req.userId,
        });
        
        await media.save();
        await media.populate('uploadedBy', 'name email');
        
        console.log('File uploaded:', { filename: file.filename, url: fileUrl });
        
        res.json({ message: 'File uploaded successfully', media });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/media/:id - удаление медиафайла
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        // Удаляем файл с диска
        const filePath = path.join(mediaDir, media.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('File deleted:', filePath);
        }
        
        await Media.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;