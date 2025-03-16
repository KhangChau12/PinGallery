// routes/imageRoutes.js - Image routes
const express = require('express');
const router = express.Router();
const { 
    upload, 
    getAllImages, 
    getImageById, 
    uploadImage, 
    updateImage, 
    deleteImage,
    getImagesByUser
} = require('../controllers/imageController');
const auth = require('../middleware/auth');

// Get all images (public)
router.get('/', getAllImages);

// Get single image by ID (public)
router.get('/:id', getImageById);

// Upload new image (requires auth)
router.post('/', auth, upload.single('image'), uploadImage);

// Update image (requires auth)
router.put('/:id', auth, updateImage);

// Delete image (requires auth)
router.delete('/:id', auth, deleteImage);

// Get images by user
router.get('/user/:userId', getImagesByUser);

module.exports = router;