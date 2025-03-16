// controllers/likeController.js - Like controller
const { runQuery, getOne, getAll } = require('../models');

// Like an image
const likeImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        
        // Check if image exists
        const image = await getOne('SELECT * FROM images WHERE id = ?', [imageId]);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        // Check if user already liked this image
        const existingLike = await getOne(
            'SELECT * FROM likes WHERE user_id = ? AND image_id = ?',
            [req.userId, imageId]
        );
        
        if (existingLike) {
            return res.status(400).json({ message: 'You already liked this image' });
        }
        
        // Add like
        await runQuery(
            'INSERT INTO likes (user_id, image_id) VALUES (?, ?)',
            [req.userId, imageId]
        );
        
        // Get updated like count
        const likeCount = await getOne(
            'SELECT COUNT(*) as count FROM likes WHERE image_id = ?',
            [imageId]
        );
        
        res.status(201).json({ 
            message: 'Image liked successfully', 
            likes: likeCount.count 
        });
    } catch (error) {
        console.error('Like image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Unlike an image
const unlikeImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        
        // Check if image exists
        const image = await getOne('SELECT * FROM images WHERE id = ?', [imageId]);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        // Check if like exists
        const existingLike = await getOne(
            'SELECT * FROM likes WHERE user_id = ? AND image_id = ?',
            [req.userId, imageId]
        );
        
        if (!existingLike) {
            return res.status(400).json({ message: 'You have not liked this image yet' });
        }
        
        // Remove like
        await runQuery(
            'DELETE FROM likes WHERE user_id = ? AND image_id = ?',
            [req.userId, imageId]
        );
        
        // Get updated like count
        const likeCount = await getOne(
            'SELECT COUNT(*) as count FROM likes WHERE image_id = ?',
            [imageId]
        );
        
        res.json({ 
            message: 'Image unliked successfully', 
            likes: likeCount.count 
        });
    } catch (error) {
        console.error('Unlike image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if user liked an image
const checkLike = async (req, res) => {
    try {
        const { imageId } = req.params;
        
        // Check if image exists
        const image = await getOne('SELECT * FROM images WHERE id = ?', [imageId]);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        // Check if user liked this image
        const existingLike = await getOne(
            'SELECT * FROM likes WHERE user_id = ? AND image_id = ?',
            [req.userId, imageId]
        );
        
        res.json({ 
            liked: !!existingLike 
        });
    } catch (error) {
        console.error('Check like error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get users who liked an image
const getLikesByImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Check if image exists
        const image = await getOne('SELECT * FROM images WHERE id = ?', [imageId]);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        // Get users who liked the image
        const likes = await getAll(`
            SELECT u.id, u.username, u.avatar, l.created_at
            FROM likes l
            JOIN users u ON l.user_id = u.id
            WHERE l.image_id = ?
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `, [imageId, limit, offset]);
        
        // Get total count for pagination
        const countResult = await getOne(
            'SELECT COUNT(*) as total FROM likes WHERE image_id = ?',
            [imageId]
        );
        
        res.json({
            likes,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
        });
    } catch (error) {
        console.error('Get likes by image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    likeImage,
    unlikeImage,
    checkLike,
    getLikesByImage
};

