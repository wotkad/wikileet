function extractMediaFilenames(content) {
    if (!content) return [];
    
    const filenames = new Set();
    
    // Ищем img теги
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1];
        const filename = extractFilenameFromUrl(src);
        if (filename) filenames.add(filename);
    }
    
    // Ищем video теги
    const videoRegex = /<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']|src=["']([^"']+)["'][\s\S]*?<\/video>/gi;
    let videoMatch;
    while ((videoMatch = videoRegex.exec(content)) !== null) {
        const src = videoMatch[1] || videoMatch[2];
        const filename = extractFilenameFromUrl(src);
        if (filename) filenames.add(filename);
    }
    
    // Также ищем прямые ссылки на медиа в любых тегах
    const mediaUrlRegex = /\/api\/media\/file\/([a-f0-9-]+\.(?:jpg|jpeg|png|gif|webp|mp4|webm|mov))/gi;
    let urlMatch;
    while ((urlMatch = mediaUrlRegex.exec(content)) !== null) {
        filenames.add(urlMatch[1]);
    }
    
    return Array.from(filenames);
}

function extractFilenameFromUrl(url) {
    if (!url) return null;
    
    // Ищем паттерн /api/media/file/文件名
    const match = url.match(/\/api\/media\/file\/([^/?&#]+)/);
    return match ? match[1] : null;
}

module.exports = {
    extractMediaFilenames,
    extractFilenameFromUrl
};