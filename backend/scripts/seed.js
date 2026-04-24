const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Tag = require('../models/Tag');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 🧹 очистка базы
        await User.deleteMany({});
        await Article.deleteMany({});
        await Category.deleteMany({});
        await Tag.deleteMany({});

        console.log('🧹 Database cleared');

        // 👤 admin user
        const admin = await User.create({
            email: 'admin@test.com',
            password: '123456',
            role: 'admin'
        });

        console.log('👤 Admin created');

        // 📂 categories
        const categories = await Category.insertMany([
            { name: 'Frontend', slug: 'frontend' },
            { name: 'Backend', slug: 'backend' },
            { name: 'Database', slug: 'database' },
        ]);

        console.log('📂 Categories created');

        // 🏷 tags
        const tags = await Tag.insertMany([
            { name: 'JavaScript', slug: 'javascript' },
            { name: 'NodeJS', slug: 'nodejs' },
            { name: 'MongoDB', slug: 'mongodb' },
            { name: 'Architecture', slug: 'architecture' },
        ]);

        console.log('🏷 Tags created');

        // 📚 articles
        const articles = await Article.insertMany([
            {
                title: 'Introduction to JavaScript',
                slug: 'intro-to-javascript',
                description: 'Basic concepts of JavaScript programming language',
                content: '<h1>JavaScript</h1><p>JavaScript is a programming language...</p>',
                category: categories[0]._id,
                tags: [tags[0]._id],
                author: admin._id,
                views: 10,
            },
            {
                title: 'Node.js Basics',
                slug: 'nodejs-basics',
                description: 'Learn backend development with Node.js',
                content: '<h1>Node.js</h1><p>Node.js is runtime...</p>',
                category: categories[1]._id,
                tags: [tags[1]._id],
                author: admin._id,
                views: 25,
            },
            {
                title: 'MongoDB Overview',
                slug: 'mongodb-overview',
                description: 'Understanding NoSQL databases',
                content: '<h1>MongoDB</h1><p>MongoDB is NoSQL database...</p>',
                category: categories[2]._id,
                tags: [tags[2]._id],
                author: admin._id,
                views: 40,
            },
            {
                title: 'Clean Architecture Basics',
                slug: 'clean-architecture',
                description: 'How to structure scalable applications',
                content: '<h1>Architecture</h1><p>Clean architecture principles...</p>',
                category: categories[1]._id,
                tags: [tags[3]._id],
                author: admin._id,
                views: 15,
            }
        ]);

        console.log(`📚 ${articles.length} articles created`);

        console.log('🎉 SEED COMPLETED SUCCESSFULLY');
        process.exit();
    } catch (error) {
        console.error('❌ SEED ERROR:', error);
        process.exit(1);
    }
}

seed();