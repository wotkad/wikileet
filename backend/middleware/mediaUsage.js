const Media = require('../models/Media');
const { extractMediaFilenames } = require('../../frontend/utils/mediaUtils');

async function updateMediaUsage(articleId, content) {
    try {
        // Извлекаем имена файлов из контента
        const filenames = extractMediaFilenames(content);
        
        // Получаем все медиафайлы по именам
        const mediaFiles = await Media.find({ filename: { $in: filenames } });
        
        // Для каждого медиафайла обновляем список статей
        for (const media of mediaFiles) {
            if (!media.usedInArticles.includes(articleId)) {
                media.usedInArticles.push(articleId);
                await media.save();
            }
        }
        
        // Удаляем статью из медиафайлов, где она больше не используется
        const allMedia = await Media.find({ usedInArticles: articleId });
        for (const media of allMedia) {
            if (!filenames.includes(media.filename)) {
                media.usedInArticles = media.usedInArticles.filter(
                    id => id.toString() !== articleId
                );
                await media.save();
            }
        }
        
        console.log(`Media usage updated for article ${articleId}, found ${mediaFiles.length} media files`);
    } catch (error) {
        console.error('Error updating media usage:', error);
    }
}

module.exports = { updateMediaUsage };