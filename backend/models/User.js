const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { transliterate } = require('transliteration');

// Функция для генерации slug из имени с транслитерацией
function generateSlug(name) {
    // Сначала транслитерируем русские буквы в латиницу
    let latinName = transliterate(name);
    
    // Затем преобразуем в slug
    return latinName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')      // Удаляем спецсимволы
        .replace(/\s+/g, '-')           // Заменяем пробелы на тире
        .replace(/--+/g, '-')           // Заменяем несколько тире на одно
        .replace(/^-+|-+$/g, '');       // Удаляем тире в начале и конце
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        sparse: true, // Позволяет быть null, но уникальным если есть значение
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    avatar: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }],
});

// Генерация slug перед сохранением
userSchema.pre('save', async function(next) {
    // Генерируем slug из имени
    if (this.isModified('name')) {
        let baseSlug = generateSlug(this.name);
        let slug = baseSlug;
        let counter = 1;
        
        // Проверяем уникальность slug
        const User = mongoose.model('User');
        while (await User.findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        this.slug = slug;
        console.log(`Generated slug "${slug}" for user "${this.name}"`);
    }
    
    next();
});

// Хеширование пароля перед сохранением
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Метод сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);