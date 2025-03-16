// controllers/userController.js - User controller
const { runQuery, getOne, getAll } = require('../models');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer storage for avatars
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/avatars'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${uniqueSuffix}${ext}`);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const uploadAvatar = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max avatar size
    }
});

// Create avatars directory if it doesn't exist
const avatarsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await getOne(`
            SELECT u.id, u.username, u.email, u.avatar, u.bio, u.created_at,
                (SELECT COUNT(*) FROM images WHERE user_id = u.id) AS images_count,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
            FROM users u
            WHERE u.id = ?
        `, [id]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if current user is following this user
        let isFollowing = false;
        if (req.userId) {
            const followExists = await getOne(
                'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
                [req.userId, id]
            );
            isFollowing = !!followExists;
        }
        
        // Format avatar URL if exists
        if (user.avatar) {
            user.avatar = `${req.protocol}://${req.get('host')}/uploads/avatars/${user.avatar}`;
        }
        
        // Add isFollowing field to response
        user.isFollowing = isFollowing;
        
        // Remove email if not the current user
        if (user.id !== req.userId) {
            delete user.email;
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile
const updateUser = async (req, res) => {
    try {
        const { username, email, bio } = req.body;
        
        // Check if the user exists
        const user = await getOne(
            'SELECT * FROM users WHERE id = ?',
            [req.userId]
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if username is already taken (if changed)
        if (username && username !== user.username) {
            const existingUser = await getOne(
                'SELECT * FROM users WHERE username = ? AND id != ?',
                [username, req.userId]
            );
            
            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }
        
        // Check if email is already taken (if changed)
        if (email && email !== user.email) {
            const existingEmail = await getOne(
                'SELECT * FROM users WHERE email = ? AND id != ?',
                [email, req.userId]
            );
            
            if (existingEmail) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
        }
        
        // Update user
        await runQuery(
            'UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?',
            [
                username || user.username,
                email || user.email,
                bio !== undefined ? bio : user.bio,
                req.userId
            ]
        );
        
        // Get updated user
        const updatedUser = await getOne(`
            SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?
        `, [req.userId]);
        
        // Format avatar URL if exists
        if (updatedUser.avatar) {
            updatedUser.avatar = `${req.protocol}://${req.get('host')}/uploads/avatars/${updatedUser.avatar}`;
        }
        
        res.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user password
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        
        // Get user with password
        const user = await getOne(
            'SELECT * FROM users WHERE id = ?',
            [req.userId]
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        await runQuery(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.userId]
        );
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload avatar
const uploadUserAvatar = async (req, res) => {
    try {
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }
        
        // Get current user
        const user = await getOne(
            'SELECT avatar FROM users WHERE id = ?',
            [req.userId]
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Delete old avatar if exists
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../uploads/avatars', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        
        // Update user avatar
        await runQuery(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [req.file.filename, req.userId]
        );
        
        // Return avatar URL
        const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
        
        res.json({ 
            message: 'Avatar uploaded successfully',
            avatar: avatarUrl 
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Follow user
const followUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Can't follow yourself
        if (parseInt(id) === req.userId) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }
        
        // Check if already following
        const existingFollow = await getOne(
            'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
            [req.userId, id]
        );
        
        if (existingFollow) {
            return res.status(400).json({ message: 'You are already following this user' });
        }
        
        // Add follow
        await runQuery(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [req.userId, id]
        );
        
        // Get updated followers count
        const followerCount = await getOne(
            'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
            [id]
        );
        
        res.status(201).json({ 
            message: 'User followed successfully', 
            followers: followerCount.count 
        });
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Unfollow user
const unfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if following
        const existingFollow = await getOne(
            'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
            [req.userId, id]
        );
        
        if (!existingFollow) {
            return res.status(400).json({ message: 'You are not following this user' });
        }
        
        // Remove follow
        await runQuery(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [req.userId, id]
        );
        
        // Get updated followers count
        const followerCount = await getOne(
            'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
            [id]
        );
        
        res.json({ 
            message: 'User unfollowed successfully', 
            followers: followerCount.count 
        });
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get followers
const getFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Check if user exists
        const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get followers
        const followers = await getAll(`
            SELECT u.id, u.username, u.avatar, f.created_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [id, limit, offset]);
        
        // Format avatar URLs
        const formattedFollowers = followers.map(follower => ({
            ...follower,
            avatar: follower.avatar 
                ? `${req.protocol}://${req.get('host')}/uploads/avatars/${follower.avatar}`
                : null
        }));
        
        // Get total count for pagination
        const countResult = await getOne(
            'SELECT COUNT(*) as total FROM follows WHERE following_id = ?',
            [id]
        );
        
        res.json({
            followers: formattedFollowers,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
        });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get following
const getFollowing = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Check if user exists
        const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get following
        const following = await getAll(`
            SELECT u.id, u.username, u.avatar, f.created_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [id, limit, offset]);
        
        // Format avatar URLs
        const formattedFollowing = following.map(follow => ({
            ...follow,
            avatar: follow.avatar 
                ? `${req.protocol}://${req.get('host')}/uploads/avatars/${follow.avatar}`
                : null
        }));
        
        // Get total count for pagination
        const countResult = await getOne(
            'SELECT COUNT(*) as total FROM follows WHERE follower_id = ?',
            [id]
        );
        
        res.json({
            following: formattedFollowing,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
        });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUserById,
    updateUser,
    updatePassword,
    uploadAvatar,
    uploadUserAvatar,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
};
