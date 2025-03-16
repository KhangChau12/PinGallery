// middleware/auth.js - JWT authentication middleware
const jwt = require('jsonwebtoken');
const { getOne } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'pingallery_jwt_secret_key';

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if user exists
        const user = await getOne('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid authentication' });
        }

        // Add user to request object
        req.user = user;
        req.userId = user.id;
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid authentication token' });
    }
};

module.exports = auth;