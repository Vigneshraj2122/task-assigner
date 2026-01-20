const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'task-scheduler-secret-123'; // Hardcoded for local dev

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    let user = db.find('users', u => u.username === username);

    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.json({
                success: true,
                token,
                user: { id: user.id, username: user.username, role: user.role }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } else {
        res.status(404).json({ success: false, message: 'User not found. Please sign up.' });
    }
});

// Signup
app.post('/api/signup', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: 'Username, password and role are required' });
    }

    // Check if user already exists
    const existingUser = db.find('users', u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = db.add('users', {
            username,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            user: { id: newUser.id, username: newUser.username, role: newUser.role },
            message: 'Account created successfully!'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error creating account' });
    }
});

// Get Tasks
app.get('/api/tasks', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const allTasks = db.get('tasks');
    const userTasks = allTasks.filter(t => t.userId === userId);
    res.json(userTasks);
});

// Add Task
app.post('/api/tasks', (req, res) => {
    const { title, description, date, time, userId, category, priority } = req.body;
    if (!title || !date || !time || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newTask = {
        title,
        description,
        date,
        time,
        userId,
        category: category || 'General',
        priority: priority || 'Medium',
        status: 'Pending',
        createdAt: new Date().toISOString()
    };

    const added = db.add('tasks', newTask);
    res.json(added);
});

// Update Task Status
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const updated = db.update('tasks', id, { status });
    if (updated) {
        res.json(updated);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// Generic API Handler for other collections
const collections = ['classes', 'lessonPlans', 'assignments', 'habits', 'holidays'];

collections.forEach(col => {
    app.get(`/api/${col}`, (req, res) => {
        const userId = req.query.userId;
        const allItems = db.get(col) || [];
        const userItems = userId ? allItems.filter(i => i.userId === userId) : allItems;
        res.json(userItems);
    });

    app.post(`/api/${col}`, (req, res) => {
        const item = {
            ...req.body,
            createdAt: new Date().toISOString()
        };
        const added = db.add(col, item);
        res.json(added);
    });

    app.delete(`/api/${col}/:id`, (req, res) => {
        const { id } = req.params;
        const deleted = db.delete(col, id);
        res.json({ success: !!deleted });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Task Scheduler is ready!`);
});
