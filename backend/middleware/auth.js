const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super_secret_jwt_key_for_student_budget_app'; // In production, use process.env.JWT_SECRET

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Format is "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user; // attach user payload { id: 1, username: 'boya' } to request
        next();
    });
}

module.exports = { authenticateToken, JWT_SECRET };
