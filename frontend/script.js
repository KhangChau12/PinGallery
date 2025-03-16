document.addEventListener('DOMContentLoaded', function() {
    // API Base URL - Change this to your backend URL when deployed
    const API_URL = 'https://pingallery-backend.com/api';
    
    // State management
    const state = {
        token: localStorage.getItem('token'),
        user: JSON.parse(localStorage.getItem('user')),
        images: [],
        currentPage: 1,
        hasMoreImages: true,
        isLoading: false,
        searchTerm: ''
    };
    
    // DOM elements
    const imageGallery = document.querySelector('#image-gallery');
    const searchInput = document.querySelector('.search-container input');
    const userActionsContainer = document.querySelector('.user-actions');
    const homeNav = document.querySelector('#home-nav');
    const exploreNav = document.querySelector('#explore-nav');
    const createNav = document.querySelector('#create-nav');
    
    // Initialize Auth UI Elements
    const loginBtn = document.createElement('a');
    loginBtn.href = '#';
    loginBtn.className = 'login-btn';
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    
    const profileBtn = document.createElement('a');
    profileBtn.href = '#';
    profileBtn.className = 'profile';
    profileBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
    
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    
    const uploadBtn = document.createElement('a');
    uploadBtn.href = '#';
    uploadBtn.className = 'upload-btn';
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
    
    // Event Listeners for navigation
    homeNav.addEventListener('click', function(e) {
        e.preventDefault();
        loadImages(1, true); // Reset and load first page
        setActiveNav(homeNav);
    });
    
    exploreNav.addEventListener('click', function(e) {
        e.preventDefault();
        // For now, explore just shows random images
        loadImages(1, true);
        setActiveNav(exploreNav);
    });
    
    createNav.addEventListener('click', function(e) {
        e.preventDefault();
        if (state.token) {
            showModal('upload');
        } else {
            showModal('login');
        }
    });
    
    function setActiveNav(navElement) {
        // Remove active class from all nav items
        document.querySelectorAll('.main-nav a').forEach(nav => {
            nav.classList.remove('active');
        });
        // Add active class to selected nav
        navElement.classList.add('active');
    }
    
    // Update header based on authentication state
    function updateAuthUI() {
        userActionsContainer.innerHTML = '';
        if (state.token && state.user) {
            // User is logged in
            userActionsContainer.appendChild(uploadBtn);
            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = state.user.username;
            usernameSpan.style.margin = '0 8px';
            userActionsContainer.appendChild(usernameSpan);
            userActionsContainer.appendChild(profileBtn);
            userActionsContainer.appendChild(logoutBtn);
        } else {
            // User is not logged in
            userActionsContainer.appendChild(loginBtn);
        }
    }
    
    // API Requests
    async function fetchImages(page = 1, search = '') {
        try {
            state.isLoading = true;
            const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`${API_URL}/images?page=${page}&limit=10${searchParam}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }
            
            const data = await response.json();
            
            state.currentPage = page;
            state.hasMoreImages = data.page < data.totalPages;
            state.isLoading = false;
            
            return data.images;
        } catch (error) {
            console.error('Error fetching images:', error);
            state.isLoading = false;
            return [];
        }
    }
    
    async function fetchImageById(imageId) {
        try {
            const headers = {};
            if (state.token) {
                headers['Authorization'] = `Bearer ${state.token}`;
            }
            
            const response = await fetch(`${API_URL}/images/${imageId}`, { headers });
            
            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching image:', error);
            return null;
        }
    }
    
    async function fetchUserById(userId) {
        try {
            const headers = {};
            if (state.token) {
                headers['Authorization'] = `Bearer ${state.token}`;
            }
            
            const response = await fetch(`${API_URL}/users/${userId}`, { headers });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }
    
    async function fetchImagesByUser(userId) {
        try {
            const response = await fetch(`${API_URL}/images/user/${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch user images');
            }
            
            const data = await response.json();
            return data.images;
        } catch (error) {
            console.error('Error fetching user images:', error);
            return [];
        }
    }
    
    async function fetchComments(imageId) {
        try {
            const response = await fetch(`${API_URL}/comments/image/${imageId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            
            const data = await response.json();
            return data.comments;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }
    
    async function likeImage(imageId) {
        try {
            if (!state.token) {
                showModal('login');
                return false;
            }
            
            const response = await fetch(`${API_URL}/likes/image/${imageId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            
            if (response.ok) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error liking image:', error);
            return false;
        }
    }
    
    async function unlikeImage(imageId) {
        try {
            if (!state.token) {
                return false;
            }
            
            const response = await fetch(`${API_URL}/likes/image/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            
            if (response.ok) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error unliking image:', error);
            return false;
        }
    }
    
    async function checkLikeStatus(imageId) {
        try {
            if (!state.token) {
                return false;
            }
            
            const response = await fetch(`${API_URL}/likes/check/image/${imageId}`, {
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.liked;
            }
            return false;
        } catch (error) {
            console.error('Error checking like status:', error);
            return false;
        }
    }
    
    async function login(username, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            
            const data = await response.json();
            
            // Save authentication data
            state.token = data.token;
            state.user = {
                id: data.id,
                username: data.username,
                email: data.email,
                avatar: data.avatar
            };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(state.user));
            
            updateAuthUI();
            hideModal();
            
            // Reload images to update the like status
            loadImages(1, true);
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return { error: error.message };
        }
    }
    
    async function register(username, email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }
            
            const data = await response.json();
            
            // Automatically log in after registration
            state.token = data.token;
            state.user = {
                id: data.id,
                username: data.username,
                email: data.email
            };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(state.user));
            
            updateAuthUI();
            hideModal();
            
            // Reload images
            loadImages(1, true);
            
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return { error: error.message };
        }
    }
    
    function logout() {
        // Clear authentication data
        state.token = null;
        state.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        updateAuthUI();
        loadImages(1, true); // Reload images to reset like status
    }
    
    async function uploadImage(formData) {
        try {
            if (!state.token) {
                showModal('login');
                return { error: 'Please login to upload images' };
            }
            
            const response = await fetch(`${API_URL}/images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            return { error: error.message };
        }
    }
    
    async function submitComment(imageId, content) {
        try {
            if (!state.token) {
                showModal('login');
                return { error: 'Please login to comment' };
            }
            
            const response = await fetch(`${API_URL}/comments/image/${imageId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ content })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Comment failed');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Comment error:', error);
            return { error: error.message };
        }
    }
    
    async function followUser(userId) {
        try {
            if (!state.token) {
                showModal('login');
                return { error: 'Please login to follow users' };
            }
            
            const response = await fetch(`${API_URL}/users/${userId}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Follow failed');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Follow error:', error);
            return { error: error.message };
        }
    }
    
    async function unfollowUser(userId) {
        try {
            if (!state.token) {
                return { error: 'Please login to unfollow users' };
            }
            
            const response = await fetch(`${API_URL}/users/${userId}/follow`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Unfollow failed');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Unfollow error:', error);
            return { error: error.message };
        }
    }
    
    async function updateUserProfile(data) {
        try {
            if (!state.token) {
                return { error: 'Authentication required' };
            }
            
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Profile update failed');
            }
            
            const updatedUser = await response.json();
            
            // Update local state
            state.user = {
                ...state.user,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio
            };
            
            localStorage.setItem('user', JSON.stringify(state.user));
            updateAuthUI();
            
            return updatedUser;
        } catch (error) {
            console.error('Profile update error:', error);
            return { error: error.message };
        }
    }
    
    async function uploadAvatar(formData) {
        try {
            if (!state.token) {
                return { error: 'Authentication required' };
            }
            
            const response = await fetch(`${API_URL}/users/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Avatar upload failed');
            }
            
            const data = await response.json();
            
            // Update local state
            state.user = {
                ...state.user,
                avatar: data.avatar
            };
            
            localStorage.setItem('user', JSON.stringify(state.user));
            updateAuthUI();
            
            return data;
        } catch (error) {
            console.error('Avatar upload error:', error);
            return { error: error.message };
        }
    }
    
    // UI Functions
    function createImageItem(image) {
        const item = document.createElement('div');
        item.className = 'item';
        item.dataset.id = image.id;
        
        item.innerHTML = `
            <div class="image-container">
                <img src="${image.url}" alt="${image.title}">
                <div class="overlay">
                    <button class="save-btn">${image.isLiked ? 'Saved' : 'Save'}</button>
                    <div class="action-icons">
                        <button class="comment-btn"><i class="fas fa-comment"></i></button>
                        <button class="share-btn"><i class="fas fa-share"></i></button>
                    </div>
                </div>
            </div>
            <div class="item-info">
                <h3>${image.title}</h3>
                <p class="description">${image.description || ''}</p>
                <div class="interaction-stats">
                    <span class="likes-count"><i class="fas fa-heart"></i> ${image.likes_count || 0}</span>
                    <span class="comments-count"><i class="fas fa-comment"></i> ${image.comments_count || 0}</span>
                </div>
                <div class="user">
                    <i class="fas fa-user-circle"></i>
                    <span class="username" data-user-id="${image.user_id}">${image.username}</span>
                </div>
            </div>
        `;
        
        // Save button styling if already liked
        if (image.isLiked) {
            const saveBtn = item.querySelector('.save-btn');
            saveBtn.textContent = 'Saved';
            saveBtn.style.backgroundColor = '#111';
        }
        
        // Add event listeners
        // Item click opens image detail
        item.addEventListener('click', function(e) {
            // Ignore clicks on buttons
            if (!e.target.closest('button')) {
                showImageDetail(image.id);
            }
        });
        
        // Save button
        const saveBtn = item.querySelector('.save-btn');
        saveBtn.addEventListener('click', async function(e) {
            e.stopPropagation(); // Prevent triggering item click
            
            if (saveBtn.textContent === 'Save') {
                const success = await likeImage(image.id);
                
                if (success) {
                    saveBtn.textContent = 'Saved';
                    saveBtn.style.backgroundColor = '#111';
                    
                    // Update like count
                    const likesCount = item.querySelector('.likes-count');
                    const count = parseInt(likesCount.textContent.replace(/[^0-9]/g, '')) + 1;
                    likesCount.innerHTML = `<i class="fas fa-heart"></i> ${count}`;
                    
                    // Show notification
                    showNotification('Image saved to your profile');
                }
            } else {
                const success = await unlikeImage(image.id);
                
                if (success) {
                    saveBtn.textContent = 'Save';
                    saveBtn.style.backgroundColor = '#e60023';
                    
                    // Update like count
                    const likesCount = item.querySelector('.likes-count');
                    const count = Math.max(0, parseInt(likesCount.textContent.replace(/[^0-9]/g, '')) - 1);
                    likesCount.innerHTML = `<i class="fas fa-heart"></i> ${count}`;
                }
            }
        });
        
        // Comment button
        const commentBtn = item.querySelector('.comment-btn');
        commentBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering item click
            showImageDetail(image.id, true); // true = focus on comment input
        });
        
        // Share button
        const shareBtn = item.querySelector('.share-btn');
        shareBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering item click
            
            // Create a temporary textarea to copy the URL
            const textarea = document.createElement('textarea');
            textarea.value = `${window.location.origin}/image/${image.id}`;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            showNotification('Image URL copied to clipboard');
        });
        
        // Username click to view profile
        const usernameEl = item.querySelector('.username');
        usernameEl.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering item click
            const userId = this.dataset.userId;
            showUserProfile(userId);
        });
        
        return item;
    }
    
    async function renderGallery(images = []) {
        // Clear gallery if it's the first page
        if (state.currentPage === 1) {
            imageGallery.innerHTML = '';
        }
        
        // Add like status for each image if user is logged in
        if (state.token) {
            for (let image of images) {
                image.isLiked = await checkLikeStatus(image.id);
            }
        }
        
        // Create image items
        for (const image of images) {
            const item = createImageItem(image);
            imageGallery.appendChild(item);
        }
        
        // Initialize masonry layout
        initMasonry();
    }
    
    function initMasonry() {
        // Initialize masonry layout after images are loaded
        imagesLoaded(imageGallery, function() {
            new Masonry(imageGallery, {
                itemSelector: '.item',
                columnWidth: '.item',
                percentPosition: true,
                transitionDuration: '0.3s'
            });
        });
    }
    
    // Modal functions
    function createModal(id, title, content) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-container');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        modalContainer.id = id;
        
        modalContainer.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);
        
        // Close modal when clicking on the close button
        modalContainer.querySelector('.close-modal').addEventListener('click', hideModal);
        
        // Close modal when clicking outside
        modalContainer.addEventListener('click', function(e) {
            if (e.target === modalContainer) {
                hideModal();
            }
        });
        
        return modalContainer;
    }
    
    function showModal(type, data = {}) {
        let template, title;
        
        switch (type) {
            case 'login':
                template = document.getElementById('login-modal-template');
                title = 'Login';
                break;
                
            case 'register':
                template = document.getElementById('register-modal-template');
                title = 'Create Account';
                break;
                
            case 'upload':
                template = document.getElementById('upload-modal-template');
                title = 'Upload Image';
                break;
                
            case 'image-detail':
                showImageDetail(data.imageId, data.focusComment);
                return;
                
            case 'profile':
                showUserProfile(data.userId);
                return;
        }
        
        const modalContainer = createModal(`${type}-modal`, title, template.innerHTML);
        
        // Add event listeners based on modal type
        switch (type) {
            case 'login':
                modalContainer.querySelector('#login-form').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const username = modalContainer.querySelector('#login-username').value;
                    const password = modalContainer.querySelector('#login-password').value;
                    
                    const result = await login(username, password);
                    
                    if (result.error) {
                        modalContainer.querySelector('.form-error').textContent = result.error;
                    }
                });
                
                modalContainer.querySelector('#switch-to-register').addEventListener('click', function(e) {
                    e.preventDefault();
                    showModal('register');
                });
                break;
                
            case 'register':
                modalContainer.querySelector('#register-form').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const username = modalContainer.querySelector('#register-username').value;
                    const email = modalContainer.querySelector('#register-email').value;
                    const password = modalContainer.querySelector('#register-password').value;
                    
                    const result = await register(username, email, password);
                    
                    if (result.error) {
                        modalContainer.querySelector('.form-error').textContent = result.error;
                    }
                });
                
                modalContainer.querySelector('#switch-to-login').addEventListener('click', function(e) {
                    e.preventDefault();
                    showModal('login');
                });
                break;
                
            case 'upload':
                // Image preview
                modalContainer.querySelector('#upload-image').addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            const preview = modalContainer.querySelector('.image-preview');
                            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                        };
                        
                        reader.readAsDataURL(file);
                    }
                });
                
                modalContainer.querySelector('#upload-form').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const fileInput = modalContainer.querySelector('#upload-image');
                    const title = modalContainer.querySelector('#upload-title').value;
                    const description = modalContainer.querySelector('#upload-description').value;
                    
                    if (!fileInput.files.length) {
                        modalContainer.querySelector('.form-error').textContent = 'Please select an image';
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);
                    formData.append('title', title);
                    formData.append('description', description);
                    
                    const result = await uploadImage(formData);
                    
                    if (result.error) {
                        modalContainer.querySelector('.form-error').textContent = result.error;
                    } else {
                        // Add the new image to the gallery and reload
                        hideModal();
                        loadImages(1, true); // Reload from first page
                        
                        // Show success message
                        showNotification('Image uploaded successfully!');
                    }
                });
                break;
        }
    }
    
    async function showImageDetail(imageId, focusComment = false) {
        // Fetch image details
        const image = await fetchImageById(imageId);
        
        if (!image) {
            showNotification('Error loading image details', 'error');
            return;
        }
        
        // Create modal
        const template = document.getElementById('image-detail-modal-template');
        const modalContainer = createModal('image-detail-modal', image.title, template.innerHTML);
        
        // Populate image details
        const detailImage = modalContainer.querySelector('.detail-image');
        detailImage.src = image.url;
        detailImage.alt = image.title;
        
        modalContainer.querySelector('.detail-title').textContent = image.title;
        modalContainer.querySelector('.detail-username').textContent = image.username;
        modalContainer.querySelector('.detail-username').dataset.userId = image.user_id;
        modalContainer.querySelector('.detail-description').textContent = image.description || '';
        modalContainer.querySelector('.like-count').textContent = image.likes_count || 0;
        modalContainer.querySelector('.comment-count').textContent = image.comments_count || 0;
        
        // Save button state
        const saveBtn = modalContainer.querySelector('.detail-save-btn');
        if (image.isLiked) {
            saveBtn.textContent = 'Saved';
            saveBtn.style.backgroundColor = '#111';
        }
        
        // Load comments
        const comments = await fetchComments(imageId);
        const commentsList = modalContainer.querySelector('.comments-list');
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        } else {
            comments.forEach(comment => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.innerHTML = `
                    <div class="comment-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-username" data-user-id="${comment.user_id}">${comment.username}</span>
                            <span class="comment-date">${formatDate(new Date(comment.created_at))}</span>
                        </div>
                        <p class="comment-text">${comment.content}</p>
                    </div>
                `;
                commentsList.appendChild(commentEl);
            });
        }
        
        // Event listeners
        // Save button
        saveBtn.addEventListener('click', async function() {
            if (saveBtn.textContent === 'Save') {
                const success = await likeImage(imageId);
                
                if (success) {
                    saveBtn.textContent = 'Saved';
                    saveBtn.style.backgroundColor = '#111';
                    
                    // Update like count
                    const likeCount = modalContainer.querySelector('.like-count');
                    const count = parseInt(likeCount.textContent) + 1;
                    likeCount.textContent = count;
                    
                    // Show notification
                    showNotification('Image saved to your profile');
                }
            } else {
                const success = await unlikeImage(imageId);
                
                if (success) {
                    saveBtn.textContent = 'Save';
                    saveBtn.style.backgroundColor = '#e60023';
                    
                    // Update like count
                    const likeCount = modalContainer.querySelector('.like-count');
                    const count = Math.max(0, parseInt(likeCount.textContent) - 1);
                    likeCount.textContent = count;
                }
            }
        });
        
        // Share button
        modalContainer.querySelector('.detail-share-btn').addEventListener('click', function() {
            // Create a temporary textarea to copy the URL
            const textarea = document.createElement('textarea');
            textarea.value = `${window.location.origin}/image/${imageId}`;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            showNotification('Image URL copied to clipboard');
        });
        
        // Username click to view profile
        modalContainer.querySelector('.detail-username').addEventListener('click', function() {
            const userId = this.dataset.userId;
            showUserProfile(userId);
        });
        
        // Comment form
        const commentForm = modalContainer.querySelector('.comment-form');
        const commentInput = modalContainer.querySelector('.comment-input');
        
        commentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const content = commentInput.value.trim();
            
            if (!content) {
                return;
            }
            
            const result = await submitComment(imageId, content);
            
            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                // Clear input
                commentInput.value = '';
                
                // Add new comment to list
                const noComments = commentsList.querySelector('.no-comments');
                if (noComments) {
                    commentsList.innerHTML = '';
                }
                
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.innerHTML = `
                    <div class="comment-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-username" data-user-id="${state.user.id}">${state.user.username}</span>
                            <span class="comment-date">Just now</span>
                        </div>
                        <p class="comment-text">${content}</p>
                    </div>
                `;
                commentsList.appendChild(commentEl);
                
                // Update comment count
                const commentCount = modalContainer.querySelector('.comment-count');
                const count = parseInt(commentCount.textContent) + 1;
                commentCount.textContent = count;
            }
        });
        
        // Focus comment input if requested
        if (focusComment) {
            commentInput.focus();
        }
    }
    
    async function showUserProfile(userId) {
        // Fetch user details
        const user = await fetchUserById(userId);
        
        if (!user) {
            showNotification('Error loading user profile', 'error');
            return;
        }
        
        // Create modal
        const template = document.getElementById('profile-modal-template');
        const modalContainer = createModal('profile-modal', `${user.username}'s Profile`, template.innerHTML);
        
        // Populate user details
        const avatarImg = modalContainer.querySelector('.profile-avatar-img');
        if (user.avatar) {
            avatarImg.src = user.avatar;
        } else {
            // Use placeholder
            avatarImg.src = 'https://via.placeholder.com/100?text=No+Image';
        }
        
        modalContainer.querySelector('.profile-username').textContent = user.username;
        
        // Only show email if viewing own profile
        const emailEl = modalContainer.querySelector('.profile-email');
        if (state.user && state.user.id === user.id) {
            emailEl.textContent = user.email;
        } else {
            emailEl.style.display = 'none';
        }
        
        modalContainer.querySelector('.images-count').textContent = user.images_count || 0;
        modalContainer.querySelector('.followers-count').textContent = user.followers_count || 0;
        modalContainer.querySelector('.following-count').textContent = user.following_count || 0;
        modalContainer.querySelector('.bio-text').textContent = user.bio || 'No bio provided.';
        
        // Adjust UI based on whether viewing own profile or other user
        const editAvatarOverlay = modalContainer.querySelector('.edit-avatar-overlay');
        const editBioBtn = modalContainer.querySelector('.edit-bio-btn');
        const editProfileBtn = modalContainer.querySelector('.edit-profile-btn');
        const changePasswordBtn = modalContainer.querySelector('.change-password-btn');
        const logoutProfileBtn = modalContainer.querySelector('.logout-profile-btn');
        
        if (!state.user || state.user.id !== user.id) {
            // Viewing another user's profile
            editAvatarOverlay.style.display = 'none';
            editBioBtn.style.display = 'none';
            editProfileBtn.style.display = 'none';
            changePasswordBtn.style.display = 'none';
            logoutProfileBtn.style.display = 'none';
            
            // Add follow/unfollow button
            const followBtn = document.createElement('button');
            followBtn.className = 'follow-btn';
            followBtn.textContent = user.isFollowing ? 'Unfollow' : 'Follow';
            followBtn.style.backgroundColor = user.isFollowing ? '#efefef' : '#e60023';
            followBtn.style.color = user.isFollowing ? '#333' : 'white';
            followBtn.style.padding = '8px 16px';
            followBtn.style.borderRadius = '24px';
            followBtn.style.fontWeight = '500';
            
            followBtn.addEventListener('click', async function() {
                if (!state.user) {
                    showModal('login');
                    return;
                }
                
                if (followBtn.textContent === 'Follow') {
                    const result = await followUser(user.id);
                    
                    if (result.error) {
                        showNotification(result.error, 'error');
                    } else {
                        followBtn.textContent = 'Unfollow';
                        followBtn.style.backgroundColor = '#efefef';
                        followBtn.style.color = '#333';
                        
                        // Update followers count
                        const followersCount = modalContainer.querySelector('.followers-count');
                        followersCount.textContent = result.followers;
                        
                        showNotification(`You are now following ${user.username}`);
                    }
                } else {
                    const result = await unfollowUser(user.id);
                    
                    if (result.error) {
                        showNotification(result.error, 'error');
                    } else {
                        followBtn.textContent = 'Follow';
                        followBtn.style.backgroundColor = '#e60023';
                        followBtn.style.color = 'white';
                        
                        // Update followers count
                        const followersCount = modalContainer.querySelector('.followers-count');
                        followersCount.textContent = result.followers;
                        
                        showNotification(`You have unfollowed ${user.username}`);
                    }
                }
            });
            
            const profileActions = modalContainer.querySelector('.profile-actions');
            profileActions.innerHTML = '';
            profileActions.appendChild(followBtn);
        } else {
            // Viewing own profile
            // Avatar upload
            editAvatarOverlay.addEventListener('click', function() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = async function(e) {
                    const file = e.target.files[0];
                    
                    if (file && file.type.startsWith('image/')) {
                        const formData = new FormData();
                        formData.append('avatar', file);
                        
                        const result = await uploadAvatar(formData);
                        
                        if (result.error) {
                            showNotification(result.error, 'error');
                        } else {
                            // Update avatar
                            avatarImg.src = result.avatar;
                            showNotification('Avatar updated successfully');
                        }
                    }
                };
                
                input.click();
            });
            
            // Bio edit
            editBioBtn.addEventListener('click', function() {
                const bioText = modalContainer.querySelector('.bio-text');
                const currentBio = bioText.textContent;
                
                // Replace with textarea
                bioText.style.display = 'none';
                
                const bioForm = document.createElement('form');
                bioForm.className = 'bio-edit-form';
                
                const bioTextarea = document.createElement('textarea');
                bioTextarea.className = 'bio-textarea';
                bioTextarea.value = currentBio === 'No bio provided.' ? '' : currentBio;
                bioTextarea.rows = 3;
                bioTextarea.style.width = '100%';
                bioTextarea.style.padding = '8px';
                bioTextarea.style.marginBottom = '8px';
                bioTextarea.style.borderRadius = '8px';
                bioTextarea.style.border = '1px solid #ddd';
                
                const saveBtn = document.createElement('button');
                saveBtn.className = 'bio-save-btn';
                saveBtn.textContent = 'Save';
                saveBtn.type = 'submit';
                saveBtn.style.backgroundColor = '#e60023';
                saveBtn.style.color = 'white';
                saveBtn.style.padding = '6px 12px';
                saveBtn.style.borderRadius = '24px';
                
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'bio-cancel-btn';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.type = 'button';
                cancelBtn.style.backgroundColor = '#efefef';
                cancelBtn.style.padding = '6px 12px';
                cancelBtn.style.borderRadius = '24px';
                cancelBtn.style.marginLeft = '8px';
                
                bioForm.appendChild(bioTextarea);
                bioForm.appendChild(saveBtn);
                bioForm.appendChild(cancelBtn);
                
                // Add form after bio text
                bioText.parentNode.insertBefore(bioForm, editBioBtn);
                
                // Focus textarea
                bioTextarea.focus();
                
                // Cancel button event
                cancelBtn.addEventListener('click', function() {
                    bioForm.remove();
                    bioText.style.display = 'block';
                });
                
                // Form submit event
                bioForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const bio = bioTextarea.value.trim();
                    
                    const result = await updateUserProfile({ bio });
                    
                    if (result.error) {
                        showNotification(result.error, 'error');
                    } else {
                        bioText.textContent = bio || 'No bio provided.';
                        bioForm.remove();
                        bioText.style.display = 'block';
                        showNotification('Bio updated successfully');
                    }
                });
            });
            
            // Profile edit
            editProfileBtn.addEventListener('click', function() {
                const modal = createModal('edit-profile-modal', 'Edit Profile', `
                    <form id="edit-profile-form">
                        <div class="form-group">
                            <label for="edit-username">Username</label>
                            <input type="text" id="edit-username" value="${state.user.username}">
                        </div>
                        <div class="form-group">
                            <label for="edit-email">Email</label>
                            <input type="email" id="edit-email" value="${state.user.email}">
                        </div>
                        <div class="form-error"></div>
                        <div class="form-actions">
                            <button type="submit" class="btn primary-btn">Save Changes</button>
                        </div>
                    </form>
                `);
                
                const form = modal.querySelector('#edit-profile-form');
                form.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const username = modal.querySelector('#edit-username').value;
                    const email = modal.querySelector('#edit-email').value;
                    
                    const result = await updateUserProfile({ username, email });
                    
                    if (result.error) {
                        modal.querySelector('.form-error').textContent = result.error;
                    } else {
                        // Update profile modal
                        modalContainer.querySelector('.profile-username').textContent = result.username;
                        modalContainer.querySelector('.profile-email').textContent = result.email;
                        
                        // Close edit modal
                        modal.remove();
                        showNotification('Profile updated successfully');
                    }
                });
            });
            
            // Password change
            changePasswordBtn.addEventListener('click', function() {
                const modal = createModal('change-password-modal', 'Change Password', `
                    <form id="change-password-form">
                        <div class="form-group">
                            <label for="current-password">Current Password</label>
                            <input type="password" id="current-password" required>
                        </div>
                        <div class="form-group">
                            <label for="new-password">New Password</label>
                            <input type="password" id="new-password" required>
                        </div>
                        <div class="form-error"></div>
                        <div class="form-actions">
                            <button type="submit" class="btn primary-btn">Change Password</button>
                        </div>
                    </form>
                `);
                
                const form = modal.querySelector('#change-password-form');
                form.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const currentPassword = modal.querySelector('#current-password').value;
                    const newPassword = modal.querySelector('#new-password').value;
                    
                    try {
                        const response = await fetch(`${API_URL}/users/password`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${state.token}`
                            },
                            body: JSON.stringify({ currentPassword, newPassword })
                        });
                        
                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || 'Password update failed');
                        }
                        
                        // Close modal
                        modal.remove();
                        showNotification('Password updated successfully');
                    } catch (error) {
                        modal.querySelector('.form-error').textContent = error.message;
                    }
                });
            });
            
            // Logout
            logoutProfileBtn.addEventListener('click', function() {
                logout();
                hideModal();
            });
        }
        
        // Load user images
        const profileGallery = modalContainer.querySelector('.profile-gallery');
        profileGallery.innerHTML = '<div class="loading">Loading images...</div>';
        
        const images = await fetchImagesByUser(userId);
        
        if (images.length === 0) {
            profileGallery.innerHTML = '<div class="no-results">No images found</div>';
        } else {
            profileGallery.innerHTML = '';
            
            // Add like status for each image if user is logged in
            if (state.token) {
                for (let image of images) {
                    image.isLiked = await checkLikeStatus(image.id);
                }
            }
            
            // Create thumbnails
            images.forEach(image => {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'profile-thumbnail';
                thumbnail.dataset.id = image.id;
                
                thumbnail.innerHTML = `
                    <img src="${image.url}" alt="${image.title}">
                    <div class="thumbnail-overlay">
                        <div class="thumbnail-info">
                            <span><i class="fas fa-heart"></i> ${image.likes_count || 0}</span>
                            <span><i class="fas fa-comment"></i> ${image.comments_count || 0}</span>
                        </div>
                    </div>
                `;
                
                thumbnail.addEventListener('click', function() {
                    showImageDetail(image.id);
                });
                
                profileGallery.appendChild(thumbnail);
            });
        }
        
        // Tab navigation
        const navBtns = modalContainer.querySelectorAll('.profile-nav-btn');
        const tabContents = modalContainer.querySelectorAll('.profile-tab-content');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tab = this.dataset.tab;
                
                // Remove active class from all buttons and contents
                navBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                this.classList.add('active');
                modalContainer.querySelector(`#profile-${tab}`).classList.add('active');
                
                // Load saved images if needed
                if (tab === 'saved' && state.user && state.user.id === userId) {
                    loadSavedImages(modalContainer);
                }
            });
        });
    }
    
    async function loadSavedImages(modalContainer) {
        const savedGallery = modalContainer.querySelector('.saved-gallery');
        savedGallery.innerHTML = '<div class="loading">Loading saved images...</div>';
        
        try {
            const response = await fetch(`${API_URL}/images?filter=liked`, {
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch saved images');
            }
            
            const data = await response.json();
            
            if (data.images.length === 0) {
                savedGallery.innerHTML = '<div class="no-results">No saved images found</div>';
            } else {
                savedGallery.innerHTML = '';
                
                // Create thumbnails
                data.images.forEach(image => {
                    const thumbnail = document.createElement('div');
                    thumbnail.className = 'profile-thumbnail';
                    thumbnail.dataset.id = image.id;
                    
                    thumbnail.innerHTML = `
                        <img src="${image.url}" alt="${image.title}">
                        <div class="thumbnail-overlay">
                            <div class="thumbnail-info">
                                <span><i class="fas fa-heart"></i> ${image.likes_count || 0}</span>
                                <span><i class="fas fa-comment"></i> ${image.comments_count || 0}</span>
                            </div>
                        </div>
                    `;
                    
                    thumbnail.addEventListener('click', function() {
                        showImageDetail(image.id);
                    });
                    
                    savedGallery.appendChild(thumbnail);
                });
            }
        } catch (error) {
            console.error('Error loading saved images:', error);
            savedGallery.innerHTML = '<div class="error">Error loading saved images</div>';
        }
    }
    
    function hideModal() {
        const modal = document.querySelector('.modal-container');
        if (modal) {
            modal.remove();
        }
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        if (type === 'error') {
            notification.style.backgroundColor = '#e60023';
        }
        
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Helper functions
    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        // Less than a minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than an hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        }
        
        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
        
        // Less than a week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }
        
        // Format as date
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }
    
    // Event Listeners
    async function loadImages(page = 1, refresh = false) {
        if (state.isLoading) {
            return;
        }
        
        if (refresh) {
            // Reset state
            state.currentPage = 1;
            state.hasMoreImages = true;
            imageGallery.innerHTML = '<div class="loading">Loading images...</div>';
        }
        
        const searchTerm = searchInput.value.trim();
        const images = await fetchImages(page, searchTerm);
        
        if (images.length > 0) {
            if (refresh) {
                imageGallery.innerHTML = '';
            }
            await renderGallery(images);
            state.images = page === 1 ? images : [...state.images, ...images];
        } else if (page === 1) {
            imageGallery.innerHTML = '<div class="no-results">No images found</div>';
        }
    }
    
    // Infinite scroll
    window.addEventListener('scroll', function() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (state.hasMoreImages && !state.isLoading) {
                loadImages(state.currentPage + 1);
            }
        }
    });
    
    // Search
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            state.searchTerm = searchInput.value.trim();
            loadImages(1, true); // Reset gallery and search from page 1
        }
    });
    
    // Authentication events
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('login');
    });
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
        loadImages(1, true); // Reload images to reset like status
    });
    
    uploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('upload');
    });
    
    profileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (state.user) {
            showUserProfile(state.user.id);
        }
    });
    
    // Initialize the app
    updateAuthUI();
    loadImages();
    
    // Add additional CSS styles for profile modal
    const style = document.createElement('style');
    style.textContent = `
        .profile-thumbnail {
            position: relative;
            overflow: hidden;
            border-radius: 8px;
            cursor: pointer;
        }
        
        .profile-thumbnail img {
            width: 100%;
            display: block;
            transition: transform 0.3s;
        }
        
        .profile-thumbnail:hover img {
            transform: scale(1.05);
        }
        
        .thumbnail-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: flex-end;
            padding: 8px;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .profile-thumbnail:hover .thumbnail-overlay {
            opacity: 1;
        }
        
        .thumbnail-info {
            color: white;
            font-size: 12px;
            display: flex;
            width: 100%;
            justify-content: space-between;
        }
        
        .thumbnail-info span {
            margin: 0 4px;
        }
        
        .bio-edit-form {
            margin-bottom: 12px;
        }
    `;
    
    document.head.appendChild(style);
});