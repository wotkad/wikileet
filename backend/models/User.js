const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { transliterate } = require('transliteration');

function generateSlug(name) {
    let latinName = transliterate(name);
    return latinName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
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
        sparse: true,
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
    lastSeen: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Генерация slug перед сохранением
userSchema.pre('save', async function(next) {
    if (this.isModified('name')) {
        let baseSlug = generateSlug(this.name);
        let slug = baseSlug;
        let counter = 1;
        
        const User = mongoose.model('User');
        while (await User.findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        this.slug = slug;
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