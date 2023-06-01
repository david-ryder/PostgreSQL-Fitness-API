const jwt = require('jsonwebtoken');

function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '7d'});
}

function authenticateToken(req, res, next)

module.exports = auth;