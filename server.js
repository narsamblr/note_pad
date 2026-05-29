const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express();//instance of express package
app.use(express.json())
app.use((req, res, next) => {
    console.log("Middleware executed");
    next()
})


const notes = [{
    id: 1,
    text: "First Note",
    checkboxes: [{
        "id": 1,
        "task": "Clean House",
        "status": "pending"
    }]
}]

const users = []

app.post('/user/register', (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: "username and password required"
            })
        }
        const existingUser = users.find((user) => user.username === username)
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "Username already exists"
            })
        }
        const hashedPassword = bcrypt.hashSync(password, 10)
        users.push({
            id: users.length + 1,
            username,
            password: hashedPassword
        })
        res.status(200).json({
            success: true,
            data: users[users.length - 1],
            message: "User registered successfully",
            error: null
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || "Internal Server Error"
        })
    }
})

app.post('/user/login', (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: "username and password required"
            })
        }
        const user = users.find((user) => user.username === username)
        if (!user) {
            return res.status(400).json({
                success: false,
                error: "Username does not exist"
            })
        }
        const PassswordMatch = bcrypt.compareSync(password, user.password)
        if (!PassswordMatch) {
            return res.status(400).json({
                success: false,
                error: "Incorrect password"
            })
        }
        const token = jwt.sign({ id: user.id, username: user.username },
            "secretkey", { expiresIn: "1h" })
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { user, token },
            error: null
        })
    }

    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || "Internal Server Error"
        })
    }
})

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: "token is required"
        })
    }

    jwt.verify(authHeader, "secretkey", (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: "Invalid token"
            })
        }


        req.user = user;
        next();
    });
};

app.use(authenticateToken);

    app.get('/notes', (req, res) => {
        res.status(200).json({
            success: true,
            data: notes,
            error: null
        });
    });

    app.post('/notes', (req, res) => {
        const body = req.body
        const { id, text, checkboxes } = body
        notes.push({
            id, text, checkboxes
        })
        res.status(200).json({
            success: true,
            data: notes,
            error: null
        })
    })

    app.get('/notes/:id', (req, res) => {
        const id = parseInt(req.params.id)
        const note = notes.filter((item) => item.id === id)
        res.status(200).json({
            success: true,
            data: note,
            error: null
        })
    })

    app.get("/note/query", (req, res) => {
        const hastext = req.query.hastext === "true"
        console.log("Query parameter hastext:", hastext)
        const filtered = notes.filter(note => {
            if (hastext) {
                return note.text !== ""
            }
            return note.text == ""
        })
        res.status(200).json({
            "success": true,
            data: filtered,
            error: null
        })
    })

    app.listen(4000, () => {
        console.log("Server running on port 4000 : http://localhost:4000")//console log simply prints whatever passed to the terminal
    })
