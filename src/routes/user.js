const express = require("express");
const router = express.Router();

// Import the database query object
const pool = require("../database_setup/database");

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
                await pool.query(
                    "INSERT INTO Users (email, username, password) VALUES ($1, $2, $3)",
                    [email, username, password]
                );
                res.status(200).send("User created successfully");
            }
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error creating new user");
    }
});

// Login a user
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
            res.send(`Login successful, user_id: ${user_id}`);
        } else {
            res.status(400).send("Invalid username or password");
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Failed to login user");
    }
});

// Delete a user
router.delete("/deleteuser", async (req, res) => {
    try {
        const { username } = req.body;
        const result = await pool.query(
            "SELECT user_id FROM Users WHERE username = $1",
            [username]
        );
        // Username found
        if (result.rowCount > 0) {
            const user_id = result.rows[0].user_id;
            await pool.query("DELETE FROM Users WHERE user_id = $1", [user_id]);
            res.send(`User with username ${username} deleted successfully`);
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
