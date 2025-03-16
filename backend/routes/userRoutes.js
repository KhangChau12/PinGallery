// routes/userRoutes.js - User routes
const express = require('express');
const router = express.Router();
const { 
    getUserById, 
    updateUser, 
    updatePassword, 
    uploadAvatar,
    uploadUserAvatar,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// Get user by ID (public, but has authentication awareness)
router.get('/:id', (req, res, next) => {
    // Pass userId if authenticated
    if (req.header('Authorization')) {
        auth(req, res, next);
    } else {
        next();
    }
}, getUserById);

// Update user profile (requires auth)
router.put('/profile', auth, updateUser);

// Update user password (requires auth)
router.put('/password', auth, updatePassword);

// Upload avatar (requires auth)
router.post('/avatar', auth, uploadAvatar.single('avatar'), uploadUserAvatar);

// Follow a user (requires auth)
router.post('/:id/follow', auth, followUser);

// Unfollow a user (requires auth)
router.delete('/:id/follow', auth, unfollowUser);

// Get user followers (public)
router.get('/:id/followers', getFollowers);

// Get user following (public)
router.get('/:id/following', getFollowing);

module.exports = router;