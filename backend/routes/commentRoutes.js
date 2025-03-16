// routes/commentRoutes.js - Comment routes
const express = require('express');
const router = express.Router();
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Get all comments for an image (public)
router.get('/image/:imageId', getComments);

// Add a comment to an image (requires auth)
router.post('/image/:imageId', auth, addComment);

// Delete a comment (requires auth)
router.delete('/:commentId', auth, deleteComment);

module.exports = router;

