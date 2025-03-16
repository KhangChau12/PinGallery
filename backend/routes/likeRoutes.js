// routes/likeRoutes.js - Like routes
const express = require('express');
const router = express.Router();
const { likeImage, unlikeImage, checkLike, getLikesByImage } = require('../controllers/likeController');
const auth = require('../middleware/auth');

// Like an image (requires auth)
router.post('/image/:imageId', auth, likeImage);

// Unlike an image (requires auth)
router.delete('/image/:imageId', auth, unlikeImage);

// Check if user liked an image (requires auth)
router.get('/check/image/:imageId', auth, checkLike);

// Get users who liked an image (public)
router.get('/image/:imageId', getLikesByImage);

module.exports = router;