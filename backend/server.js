const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:5000',
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Хранилище онлайн пользователей (поддерживает несколько соединений)
const onlineUsers = new Map(); // userId -> Set(socketId)
const lastBroadcastTime = new Map(); // eventType -> timestamp

function canBroadcast(eventType, minInterval = 1000) {
    const lastTime = lastBroadcastTime.get(eventType) || 0;
    const now = Date.now();
    if (now - lastTime < minInterval) {
        return false;
    }
    lastBroadcastTime.set(eventType, now);
    return true;
}

// Middleware для Socket.IO аутентификации - убираем, так как токен в cookie
io.use(async (socket, next) => {
    try {
        // Получаем cookie из handshake
        const cookie = socket.handshake.headers.cookie;
        if (!cookie) {
            return next(new Error('No cookies'));
        }
        
        // Парсим cookie
        const cookies = {};
        cookie.split(';').forEach(c => {
            const [key, value] = c.trim().split('=');
            cookies[key] = value;
        });
        
        const token = cookies.token;
        if (!token) {
            return next(new Error('No token'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
    } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[WebSocket] User ${userId} connected`);
    
    // Добавляем соединение
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Обновляем lastSeen
    const User = require('./models/User');
    User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(console.error);
    
    // Рассылаем обновленный список (с защитой от частой рассылки)
    const onlineUserIds = Array.from(onlineUsers.keys());
    if (canBroadcast('users:online', 500)) {
        console.log(`[WebSocket] Broadcasting online users:`, onlineUserIds);
        io.emit('users:online', { 
            onlineUserIds: onlineUserIds,
            timestamp: Date.now()
        });
    }
    
    // Обработка обновления статуса
    socket.on('user:online', () => {
        if (canBroadcast(`user:online:${userId}`, 1000)) {
            console.log(`[WebSocket] User ${userId} requested status update`);
            
            // Убеждаемся что пользователь в списке
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId).add(socket.id);
            
            // Отправляем только этому сокету его статус
            socket.emit('user:status', { userId, online: true });
            
            // Рассылаем обновленный список всем (с защитой)
            const updatedUsers = Array.from(onlineUsers.keys());
            if (canBroadcast('users:online', 500)) {
                io.emit('users:online', { 
                    onlineUserIds: updatedUsers,
                    timestamp: Date.now()
                });
            }
        }
    });
    
    // Обработка отключения
    socket.on('disconnect', async () => {
        console.log(`[WebSocket] User ${userId} disconnected`);
        
        if (onlineUsers.has(userId)) {
            onlineUsers.get(userId).delete(socket.id);
            
            if (onlineUsers.get(userId).size === 0) {
                onlineUsers.delete(userId);
                await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
                console.log(`[WebSocket] User ${userId} is offline`);
                
                // Сообщаем о выходе
                io.emit('user:status', { userId, online: false });
            }
        }
        
        // Рассылаем обновленный список (с защитой)
        const updatedUsers = Array.from(onlineUsers.keys());
        if (canBroadcast('users:online', 500)) {
            io.emit('users:online', { 
                onlineUserIds: updatedUsers,
                timestamp: Date.now()
            });
        }
    });
    
    socket.on('ping', () => {
        socket.emit('pong');
    });
});

// CORS настройки
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

// Middleware для проверки токена и добавления userRole в req
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userRole = decoded.role;
            req.userId = decoded.userId;
        } catch (error) {
            // Токен невалидный, просто игнорируем
        }
    }
    next();
});

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/profile', require('./routes/profile'));

// Эндпоинт для получения lastSeen пользователей
app.get('/api/profile/users/lastseen', async (req, res) => {
    try {
        const User = require('./models/User');
        const users = await User.find({}, 'lastSeen slug name');
        const lastSeenMap = {};
        users.forEach(user => {
            lastSeenMap[user._id.toString()] = user.lastSeen;
        });
        res.json(lastSeenMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/info', (req, res) => {
    res.json({
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                logout: 'POST /api/auth/logout'
            },
            articles: {
                list: 'GET /api/articles',
                get: 'GET /api/articles/:slug',
                create: 'POST /api/articles (admin)',
                update: 'PUT /api/articles/:id (admin)',
                delete: 'DELETE /api/articles/:id (admin)'
            },
            categories: {
                list: 'GET /api/categories',
                create: 'POST /api/categories (admin)'
            },
            tags: {
                list: 'GET /api/tags'
            }
        }
    });
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// SPA fallback
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    const staticExtensions = /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/;
    if (staticExtensions.test(req.path)) {
        return next();
    }
    
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('🔥 ERROR:', err);
    res.status(500).json({
        error: err.message || 'Something went wrong!'
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`💻 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Добавляем соединение пользователя
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Обновляем lastSeen при подключении
    const User = require('./models/User');
    User.findByIdAndUpdate(userId, { lastSeen: new Date() }).then(() => {
        console.log(`Updated lastSeen for user ${userId}`);
    }).catch(err => console.error('Error updating lastSeen:', err));
    
    // Рассылаем обновленный список онлайн пользователей
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit('users:online', { 
        onlineUserIds: onlineUserIds,
        timestamp: Date.now()
    });
    
    // Отправляем текущему пользователю его статус
    socket.emit('user:status', { userId, online: true });
    
    // Обработка принудительного обновления статуса
    socket.on('user:online', () => {
        console.log(`User ${userId} requested online status update`);
        socket.emit('user:status', { userId, online: true });
        
        // Убеждаемся что пользователь есть в onlineUsers
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);
        
        // Обновляем список для всех
        io.emit('users:online', { 
            onlineUserIds: Array.from(onlineUsers.keys()),
            timestamp: Date.now()
        });
    });
    
    // Обработка отключения
    socket.on('disconnect', async () => {
        console.log(`User ${userId} disconnected from socket ${socket.id}`);
        
        if (onlineUsers.has(userId)) {
            onlineUsers.get(userId).delete(socket.id);
            
            if (onlineUsers.get(userId).size === 0) {
                onlineUsers.delete(userId);
                const updatedAt = new Date();
                await User.findByIdAndUpdate(userId, { lastSeen: updatedAt });
                console.log(`User ${userId} is offline, lastSeen updated to ${updatedAt}`);
                
                // Сообщаем всем, что пользователь оффлайн
                io.emit('user:status', { userId, online: false, lastSeen: updatedAt });
            }
        }
        
        io.emit('users:online', { 
            onlineUserIds: Array.from(onlineUsers.keys()),
            timestamp: Date.now()
        });
    });
    
    socket.on('ping', () => {
        socket.emit('pong');
    });
});