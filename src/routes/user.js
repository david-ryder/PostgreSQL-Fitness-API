const express = require("express");
const router = express.Router();

// Import the database query object
const pool = require("../database_setup/database");

// Import JWT functions from auth.js
const { generateAccessToken, authenticateToken } = require("../auth");

// ===== USER FUNCTIONS =====
// Create new user
router.post("/register", async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT user_id FROM Users WHERE email = $1",
            [email]
        );
        // Email already exists
        if (result.rowCount > 0) {
            res.status(400).send("Email already exists");
        }
        // Email is unique
        else {
            const result = await pool.query(
                "SELECT user_id FROM Users WHERE username = $1",
                [username]
            );
            // Username already exists
            if (result.rowCount > 0) {
                res.status(400).send("Username already exists");
            } else {
                await pool.query("BEGIN");
                const newUser = await pool.query(
                    "INSERT INTO Users (email, username, password) VALUES ($1, $2, $3) RETURNING user_id",
                    [email, username, password]
                );
                const token = generateAccessToken({
                    user_id: newUser.rows[0].user_id,
                });
                await pool.query("COMMIT");
                res.status(201).json({ token });
            }
        }
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error(error.message);
        res.status(500).send("Error creating new user");
    }
});

// Login a user - verify credentials in database, give user access token
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Check if username and password combination is valid
    try {
        const result = await pool.query(
            "SELECT user_id FROM Users WHERE username = $1 AND password = $2",
            [username, password]
        );
        if (result.rowCount > 0) {
            const user_id = result.rows[0].user_id;
            const token = generateAccessToken({ user_id: user_id });
            res.status(200).json({ token });
        } else {
            res.status(400).send("Invalid username or password");
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Failed to login user");
    }
});

// Delete a user
router.delete("/deleteuser", authenticateToken, async (req, res) => {
    const { username } = req.body;
    const authenticated_id = req.user.user_id;

    try {
        const result = await pool.query(
            "SELECT user_id FROM Users WHERE username = $1",
            [username]
        );
        // Username found
        if (result.rowCount > 0) {
            const found_user_id = result.rows[0].user_id;

            // Check if the authenticated user is the owner of the account
            if (authenticated_id === found_user_id) {
                await pool.query("DELETE FROM Users WHERE user_id = $1", [
                    authenticated_id,
                ]);
                res.send(`User with username ${username} deleted successfully`);
            } else {
                res.status(403).json("Unauthorized to delete this user");
            }
        }
        // No user with this username found
        else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Failed to delete user");
    }
});

// ===== ADMIN FUNCTIONS =====
// Find all users
router.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM Users");
        res.send(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error fetching users");
    }
});

// Export this router to use globally
module.exports = router;
