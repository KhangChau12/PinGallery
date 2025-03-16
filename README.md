# PinGallery - Pinterest-like Image Gallery Application

A full-stack web application that allows users to share, discover, and save images in a Pinterest-like interface.

## Features

- **User Authentication**: Register, login, and user profile management
- **Image Gallery**: Masonry layout with infinite scrolling
- **Image Upload**: Share images with title and description
- **Image Interaction**: Like/save images and add comments
- **User Profiles**: View user profiles and their uploaded images
- **Follow System**: Follow/unfollow other users
- **Search**: Search for images by title or description

## Technology Stack

### Backend
- Node.js
- Express.js
- SQLite (with sqlite3)
- JSON Web Token (JWT) for authentication
- Multer for file uploads
- bcrypt.js for password hashing

### Frontend
- Vanilla JavaScript
- HTML5/CSS3
- Masonry.js for layout
- Font Awesome for icons

## Project Structure

```
pinGallery/
├── database_setup.sql      # SQL schema and sample data
├── initDatabase.js         # Database initialization script
├── database.db             # SQLite database (created after initialization)
├── package.json            # Project configuration and dependencies
├── README.md               # Project documentation
│
├── frontend/               # Frontend files
│   ├── index.html          # Main HTML page
│   ├── style.css           # Styles for the application
│   ├── script.js           # Frontend JavaScript with API integration
│   └── images/             # Static image assets
│
└── backend/                # Backend files
    ├── server.js           # Main server file
    ├── config/
    │   └── db.js           # Database configuration
    ├── controllers/
    │   ├── authController.js    # Authentication logic
    │   ├── imageController.js   # Image management
    │   ├── commentController.js # Comment functionality
    │   ├── likeController.js    # Like functionality
    │   └── userController.js    # User management
    ├── middleware/
    │   └── auth.js         # JWT authentication middleware
    ├── models/
    │   └── index.js        # Database models and schema
    ├── routes/
    │   ├── authRoutes.js   # Authentication routes
    │   ├── imageRoutes.js  # Image routes
    │   ├── commentRoutes.js # Comment routes
    │   ├── likeRoutes.js   # Like routes
    │   └── userRoutes.js   # User routes
    └── uploads/            # Directory for uploaded files
        └── avatars/        # Directory for user avatars
```

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Steps

1. **Clone the repository or download the source code**

2. **Install dependencies**
   ```
   npm install
   ```

3. **Initialize the database**
   ```
   node initDatabase.js
   ```
   This will create the SQLite database and populate it with sample data.

4. **Start the backend server**
   ```
   npm start
   ```
   Or for development with auto-reload:
   ```
   npm run dev
   ```

5. **Access the frontend**
   Open `frontend/index.html` in your browser, or serve it with a simple HTTP server:
   ```
   cd frontend
   npx http-server
   ```
   Then access the application at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Images
- `GET /api/images` - Get all images (with pagination)
- `GET /api/images/:id` - Get image by ID
- `POST /api/images` - Upload new image (requires auth)
- `PUT /api/images/:id` - Update image (requires auth)
- `DELETE /api/images/:id` - Delete image (requires auth)
- `GET /api/images/user/:userId` - Get images by user

### Comments
- `GET /api/comments/image/:imageId` - Get comments for an image
- `POST /api/comments/image/:imageId` - Add a comment (requires auth)
- `DELETE /api/comments/:commentId` - Delete a comment (requires auth)

### Likes
- `POST /api/likes/image/:imageId` - Like an image (requires auth)
- `DELETE /api/likes/image/:imageId` - Unlike an image (requires auth)
- `GET /api/likes/check/image/:imageId` - Check if user liked an image (requires auth)
- `GET /api/likes/image/:imageId` - Get users who liked an image

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile (requires auth)
- `PUT /api/users/password` - Update user password (requires auth)
- `POST /api/users/avatar` - Upload user avatar (requires auth)
- `POST /api/users/:id/follow` - Follow a user (requires auth)
- `DELETE /api/users/:id/follow` - Unfollow a user (requires auth)
- `GET /api/users/:id/followers` - Get user followers
- `GET /api/users/:id/following` - Get user following

## Sample User Accounts

The database initialization creates three sample users:

1. **Username**: john_doe  
   **Email**: john@example.com  
   **Password**: password123

2. **Username**: alice_smith  
   **Email**: alice@example.com  
   **Password**: password123

3. **Username**: mike_johnson  
   **Email**: mike@example.com  
   **Password**: password123

## Screenshots

[Screenshots would be included here]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Pinterest for inspiration
- Masonry.js for the responsive grid layout
- Font Awesome for the icons
