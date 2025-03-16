// controllers/authController.js - Authentication controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getOne } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'pingallery_jwt_secret_key';

// Register a new user
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if required fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user already exists
        const existingUser = await getOne('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const { id } = await runQuery(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // Generate JWT token
        const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

        // Return user info and token
        res.status(201).json({
            id,
            username,
            email,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if required fields are provided
        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        // Find user by username or email
        const user = await getOne(
            'SELECT * FROM users WHERE username = ? OR email = ?', 
            [username, username]
        );

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

        // Return user info and token
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        // User is already available from auth middleware
        const user = await getOne(
            'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?', 
            [req.userId]
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};
