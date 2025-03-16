// controllers/commentController.js - Comment controller
const { runQuery, getOne, getAll } = require('../models');

// Get comments for an image
const getComments = async (req, res) => {
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
        
        // Get comments
        const comments = await getAll(`
            SELECT c.*, u.username, u.avatar 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.image_id = ?
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `, [imageId, limit, offset]);
        
        // Get total count for pagination
        const countResult = await getOne(
            'SELECT COUNT(*) as total FROM comments WHERE image_id = ?',
            [imageId]
        );
        
        res.json({
            comments,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add a comment to an image
const addComment = async (req, res) => {
    try {
        const { imageId } = req.params;
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' });
        }
        
        // Check if image exists
        const image = await getOne('SELECT * FROM images WHERE id = ?', [imageId]);
        
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        // Add comment
        const { id } = await runQuery(
            'INSERT INTO comments (user_id, image_id, content) VALUES (?, ?, ?)',
            [req.userId, imageId, content]
        );
        
        // Get the saved comment with user info
        const comment = await getOne(`
            SELECT c.*, u.username, u.avatar 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [id]);
        
        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        
        // Check if comment exists
        const comment = await getOne('SELECT * FROM comments WHERE id = ?', [commentId]);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        
        // Check if user is the owner of the comment
        if (comment.user_id !== req.userId) {
            // Also allow the image owner to delete comments on their image
            const image = await getOne('SELECT * FROM images WHERE id = ?', [comment.image_id]);
            if (!image || image.user_id !== req.userId) {
                return res.status(403).json({ message: 'Not authorized to delete this comment' });
            }
        }
        
        // Delete comment
        await runQuery('DELETE FROM comments WHERE id = ?', [commentId]);
        
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getComments,
    addComment,
    deleteComment
};
