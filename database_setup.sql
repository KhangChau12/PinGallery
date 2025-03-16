-- SQLite database setup script for PinGallery

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, image_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Insert some sample data for testing

-- Sample users with hashed passwords (password: 'password123')
INSERT INTO users (username, email, password, bio) VALUES 
('john_doe', 'john@example.com', '$2a$10$6Bnv6uDGICIxKJ5zhyZyPehTlxJG0w0EnBWT0RKB8dmMxj5cUeRCe', 'Photography enthusiast'),
('alice_smith', 'alice@example.com', '$2a$10$6Bnv6uDGICIxKJ5zhyZyPehTlxJG0w0EnBWT0RKB8dmMxj5cUeRCe', 'Travel blogger'),
('mike_johnson', 'mike@example.com', '$2a$10$6Bnv6uDGICIxKJ5zhyZyPehTlxJG0w0EnBWT0RKB8dmMxj5cUeRCe', 'Food lover');

-- Sample images
INSERT INTO images (user_id, url, title, description) VALUES
(1, 'sample1.jpg', 'Beautiful Nature', 'Explore the beauty of nature'),
(1, 'sample2.jpg', 'City Skyline', 'Urban landscapes at sunset'),
(2, 'sample3.jpg', 'Delicious Food', 'Tasty recipes and food inspiration'),
(2, 'sample4.jpg', 'Travel Destinations', 'Must-visit places around the world'),
(3, 'sample5.jpg', 'Creative Art', 'Inspiring artwork and creative ideas');

-- Sample comments
INSERT INTO comments (user_id, image_id, content) VALUES
(2, 1, 'Beautiful shot! Where was this taken?'),
(3, 1, 'Love the colors in this picture!'),
(1, 3, 'This looks delicious! Can you share the recipe?'),
(2, 5, 'Very creative, I love the style!');

-- Sample likes
INSERT INTO likes (user_id, image_id) VALUES
(2, 1),
(3, 1),
(1, 3),
(1, 5),
(2, 5);

-- Sample follows
INSERT INTO follows (follower_id, following_id) VALUES
(1, 2),
(1, 3),
(2, 3),
(3, 1);