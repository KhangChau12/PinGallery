// controllers/imageController.js - Image controller
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { runQuery, getOne, getAll } = require('../models');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
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

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    }
});

// Get all images with pagination
const getAllImages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = `
            SELECT i.*, u.username, u.avatar,
                (SELECT COUNT(*) FROM likes WHERE image_id = i.id) AS likes_count,
                (SELECT COUNT(*) FROM comments WHERE image_id = i.id) AS comments_count
            FROM images i
            JOIN users u ON i.user_id = u.id
        `;
        
        let params = [];
        
        // Add search filter if provided
        if (search) {
            query += ` WHERE i.title LIKE ? OR i.description LIKE ? `;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        // Get images
        const images = await getAll(query, params);
        
        // Get total count for pagination
        const countResult = await getOne(
            `SELECT COUNT(*) as total FROM images ${search ? 'WHERE title LIKE ? OR description LIKE ?' : ''}`,
            search ? [`%${search}%`, `%${search}%`] : []
        );
        
        // Format the image URLs
        const formattedImages = images.map(image => ({
            ...image,
            url: `${req.protocol}://${req.get('host')}/uploads/${image.url}`,
            isLiked: false // Will be updated in frontend based on user state
        }));
        
        res.json({
            images: formattedImages,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
        });
    } catch (error) {
        console.error('Get all images error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single image by ID
const getImageById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const image = await getOne(`
            SELECT i.*, u.username, u.avatar,
                (SELECT COUNT(*) FROM likes WHERE image_id = i.id) AS likes_count,
                (SELECT COUNT(*) FROM comments WHERE image_id = i.id) AS comments_count
            FROM images i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        `, [id]);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        // Check if current user has liked this image (if authenticated)
        let isLiked = false;
        if (req.userId) {
            const likeExists = await getOne(
                'SELECT 1 FROM likes WHERE user_id = ? AND image_id = ?',
                [req.userId, id]
            );
            isLiked = !!likeExists;
        }
        
        // Format image URL
        image.url = `${req.protocol}://${req.get('host')}/uploads/${image.url}`;
        image.isLiked = isLiked;
        
        res.json(image);
    } catch (error) {
        console.error('Get image by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload new image
const uploadImage = async (req, res) => {
    try {
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }
        
        const { title, description } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Please provide a title for the image' });
        }
        
        // Save image details to database
        const { id } = await runQuery(
            'INSERT INTO images (user_id, url, title, description) VALUES (?, ?, ?, ?)',
            [req.userId, req.file.filename, title, description || '']
        );
        
        // Get the saved image with user info
        const image = await getOne(`
            SELECT i.*, u.username, u.avatar
            FROM images i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        `, [id]);
        
        // Format image URL
        image.url = `${req.protocol}://${req.get('host')}/uploads/${image.url}`;
        image.likes_count = 0;
        image.comments_count = 0;
        
        res.status(201).json(image);
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update image
const updateImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        
        // Check if image exists and belongs to the user
        const image = await getOne(
            'SELECT * FROM images WHERE id = ?',
            [id]
        );
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        if (image.user_id !== req.userId) {
            return res.status(403).json({ message: 'You are not authorized to update this image' });
        }
        
        // Update image details
        await runQuery(
            'UPDATE images SET title = ?, description = ? WHERE id = ?',
            [title || image.title, description || image.description, id]
        );
        
        // Get updated image
        const updatedImage = await getOne(`
            SELECT i.*, u.username, u.avatar,
                (SELECT COUNT(*) FROM likes WHERE image_id = i.id) AS likes_count,
                (SELECT COUNT(*) FROM comments WHERE image_id = i.id) AS comments_count
            FROM images i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        `, [id]);
        
        // Format image URL
        updatedImage.url = `${req.protocol}://${req.get('host')}/uploads/${updatedImage.url}`;
        
        res.json(updatedImage);
    } catch (error) {
        console.error('Update image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete image
const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if image exists and belongs to the user
        const image = await getOne(
            'SELECT * FROM images WHERE id = ?',
            [id]
        );
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        if (image.user_id !== req.userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this image' });
        }
        
        // Delete the image file
        const imagePath = path.join(__dirname, '../uploads', image.url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        
        // Delete image from database (cascading delete will remove related comments and likes)
        await runQuery('DELETE FROM images WHERE id = ?', [id]);
        
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get images by user
const getImagesByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Check if user exists
        const user = await getOne('SELECT id, username, avatar FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get user's images
        const images = await getAll(`
            SELECT i.*, u.username, u.avatar,
                (SELECT COUNT(*) FROM likes WHERE image_id = i.id) AS likes_count,
                (SELECT COUNT(*) FROM comments WHERE image_id = i.id) AS comments_count
            FROM images i
            JOIN users u ON i.user_id = u.id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);
        
        // Get total count for pagination
        const countResult = await getOne(
            'SELECT COUNT(*) as total FROM images WHERE user_id = ?',
            [userId]
        );
        
        // Format the image URLs
        const formattedImages = images.map(image => ({
            ...image,
            url: `${req.protocol}://${req.get('host')}/uploads/${image.url}`,
            isLiked: false // Will be updated in frontend based on user state
        }));
        
        res.json({
            images: formattedImages,
            user,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
        });
    } catch (error) {
        console.error('Get images by user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    upload,
    getAllImages,
    getImageById,
    uploadImage,
    updateImage,
    deleteImage,
    getImagesByUser
};