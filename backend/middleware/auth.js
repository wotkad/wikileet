const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Проверяем токен в cookies
        const token = req.cookies.token;
        
        console.log('Auth middleware - token present:', !!token);
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        
        console.log('Auth middleware - user:', { userId: req.userId, role: req.userRole });
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };