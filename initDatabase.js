// initDatabase.js - Script to initialize the database with schema and sample data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Database file path
const dbPath = path.resolve(__dirname, 'database.db');

// Read SQL setup file
const setupSQL = fs.readFileSync(path.resolve(__dirname, 'database_setup.sql'), 'utf8');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Split SQL into individual statements
const statements = setupSQL
    .replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '') // Remove comments
    .split(';')
    .filter(stmt => stmt.trim());

// Execute each statement
console.log('Initializing database...');
db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    statements.forEach((statement, i) => {
        if (statement.trim()) {
            db.run(statement, (err) => {
                if (err) {
                    console.error(`Error executing statement ${i}:`, err.message);
                    console.error('Statement:', statement);
                }
            });
        }
    });
    
    db.run('COMMIT', (err) => {
        if (err) {
            console.error('Error committing transaction:', err.message);
        } else {
            console.log('Database initialized successfully');
        }
        
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            console.log('Database connection closed');
        });
    });
});

console.log(`Database created at: ${dbPath}`);
console.log('You can now start the application with: npm start');