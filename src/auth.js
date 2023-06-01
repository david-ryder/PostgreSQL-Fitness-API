const jwt = require("jsonwebtoken");

// Create an access token, store this on client side
function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: "60s" });
}

function authenticateToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json("No token provided");
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).json("Failed to authenticate token");
        }

        req.user = decoded;
        next();
    });
}

module.exports = {
    generateAccessToken,
    authenticateToken,
};
