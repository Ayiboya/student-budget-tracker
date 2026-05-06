const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// --- AUTH API ---

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: "Username already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Registration successful", id: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during registration" });
    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: "Invalid username or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid username or password" });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: "Login successful", token });
    });
});

// Apply authentication middleware to all routes below this line
router.use(authenticateToken);

// --- TRANSACTIONS API ---

router.get('/transactions', (req, res) => {
    db.all("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

router.post('/transactions', (req, res) => {
    const { type, amount, category, description, date } = req.body;
    const insertDate = date || new Date().toISOString().split('T')[0];
    
    if (!type || !amount || !category) return res.status(400).json({ error: "Missing required fields" });

    const sql = `INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [req.user.id, type, amount, category, description, insertDate], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Transaction added successfully", id: this.lastID });
    });
});

router.put('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;
    
    if (!type || !amount || !category) return res.status(400).json({ error: "Missing required fields" });

    const sql = `UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ?`;
    db.run(sql, [type, amount, category, description, date, id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Transaction updated successfully", changes: this.changes });
    });
});

router.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM transactions WHERE id = ? AND user_id = ?", [id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Transaction deleted successfully", changes: this.changes });
    });
});

router.get('/summary', (req, res) => {
    db.all("SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ? GROUP BY type", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let income = 0;
        let expenses = 0;
        rows.forEach(row => {
            if (row.type === 'income') income = row.total;
            if (row.type === 'expense') expenses = row.total;
        });
        
        res.json({ income, expenses, balance: income - expenses });
    });
});

// --- GOALS API ---

router.get('/goals', (req, res) => {
    db.all("SELECT * FROM goals WHERE user_id = ?", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

router.post('/goals', (req, res) => {
    const { title, targetAmount, deadline } = req.body;
    if (!title || !targetAmount) return res.status(400).json({ error: "Missing required fields" });

    const sql = `INSERT INTO goals (user_id, title, targetAmount, deadline) VALUES (?, ?, ?, ?)`;
    db.run(sql, [req.user.id, title, targetAmount, deadline], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Goal added successfully", id: this.lastID });
    });
});

router.put('/goals/:id/progress', (req, res) => {
    const { id } = req.params;
    const { amountToAdd } = req.body;
    
    if (!amountToAdd) return res.status(400).json({ error: "Amount to add is required" });

    const sql = `UPDATE goals SET currentAmount = currentAmount + ? WHERE id = ? AND user_id = ?`;
    db.run(sql, [amountToAdd, id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Goal progress updated", changes: this.changes });
    });
});

module.exports = router;
