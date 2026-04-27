const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Путь к папке uploads в корне проекта
const uploadsDir = path.join(__dirname, '../../uploads/avatars');

// Создаем директорию для аватаров если её нет
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка хранения
const storage = multer.memoryStorage();

// Фильтр файлов
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

// Функция для обработки и сохранения изображения
async function processAndSaveAvatar(file, oldAvatarPath = null) {
    try {
        // Генерируем уникальное имя
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Оптимизируем и сохраняем изображение
        await sharp(file.buffer)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(filePath);
        
        // Удаляем старый аватар если есть и это не дефолтный
        if (oldAvatarPath && oldAvatarPath !== 'default-avatar.png') {
            const oldFilePath = path.join(uploadsDir, oldAvatarPath);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        
        return fileName;
    } catch (error) {
        console.error('Error processing avatar:', error);
        throw error;
    }
}

// Функция для удаления аватара
async function deleteAvatar(avatarFileName) {
    if (avatarFileName && avatarFileName !== 'default-avatar.png') {
        const filePath = path.join(uploadsDir, avatarFileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    }
    return false;
}

// Функция для получения пути к дефолтному аватару
function getDefaultAvatarPath() {
    return path.join(uploadsDir, 'default-avatar.png');
}

module.exports = { upload, processAndSaveAvatar, deleteAvatar, getDefaultAvatarPath };