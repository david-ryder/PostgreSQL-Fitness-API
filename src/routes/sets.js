const express = require('express');
const router = express.Router();

// Import the database query object
const pool = require('../database_setup/database');

// ===== USER FUNCTIONS =====
// Create a new set
router.post('/exercises/:exercise_id/sets', async (req, res) => {
    const { exercise_id } = req.params;
    const { weight, reps } = req.body;

    try {
        const result = await pool.query('INSERT INTO Sets (exercise_id, weight, reps) VALUES ($1, $2, $3) RETURNING *', [exercise_id, weight, reps]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Failed to create set');
    }
});

// Get all sets for this exercise
router.get('/exercises/:exercise_id/sets', async (req, res) => {
    const { exercise_id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM Sets WHERE exercise_id = $1', [exercise_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Failed to fetch sets');
    }
});

// Delete a set
router.delete('/sets/:set_id', async (req, res) => {
    const { set_id } = req.params;

    try {
        await pool.query('DELETE FROM Sets WHERE set_id = $1', [set_id]);
        res.status(200).send('Successfully deleted set');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Failed to delete set');
    }
});

// ===== ADMIN FUNCTIONS =====
// Fetch all sets
router.get('/sets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Sets');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Failed to fetch sets');
    }
});

// Export this router to use globally
module.exports = router;