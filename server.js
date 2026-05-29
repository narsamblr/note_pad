const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2'); // Added MySQL connector

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log("Middleware executed");
    next();
});

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',             // Your local MySQL username
    password: '',             // Your local MySQL password (leave empty if none)
    database: 'YOUR_DATABASE_NAME' // ✏️ REPLACE WITH YOUR CLIMATE DB NAME
});

// Temporary array to hold registered users
const users = [];

// ==========================================
// 2. USER AUTHENTICATION ROUTES
// ==========================================
app.post('/user/register', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: "username and password required" });
        }
        const existingUser = users.find((user) => user.username === username);
        if (existingUser) {
            return res.status(400).json({ success: false, error: "Username already exists" });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        users.push({
            id: users.length + 1,
            username,
            password: hashedPassword
        });
        res.status(200).json({
            success: true,
            data: { id: users[users.length - 1].id, username: users[users.length - 1].username },
            message: "User registered successfully",
            error: null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

app.post('/user/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, error: "username and password required" });
        }
        const user = users.find((user) => user.username === username);
        if (!user) {
            return res.status(400).json({ success: false, error: "Username does not exist" });
        }
        const PassswordMatch = bcrypt.compareSync(password, user.password);
        if (!PassswordMatch) {
            return res.status(400).json({ success: false, error: "Incorrect password" });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, "secretkey", { expiresIn: "1h" });
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { username: user.username, token },
            error: null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// ==========================================
// 3. SECURITY GATEKEEPER (MIDDLEWARE)
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ success: false, error: "token is required" });
    }
    jwt.verify(authHeader, "secretkey", (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: "Invalid token" });
        }
        req.user = user;
        next();
    });
};

// Everything below this line requires a valid login token to access!
app.use(authenticateToken);

// ==========================================
// 4. SECURE CLIMATE DATA DATA ENDPOINTS
// ==========================================

// Fetch all weather records from your MySQL database
app.get('/climate', (req, res) => {
    // ✏️ REPLACE 'YOUR_TABLE_NAME' WITH YOUR ACTUAL CLIMATE TABLE NAME
    const sqlQuery = "SELECT * FROM YOUR_TABLE_NAME"; 
    
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: "Database query failed" });
        }
        res.status(200).json({
            success: true,
            data: results,
            error: null
        });
    });
});

app.listen(4000, () => {
    console.log("Server running on port 4000 : http://localhost:4000");
});