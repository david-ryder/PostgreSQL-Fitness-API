const express = require('express');
const router = express.Router();

// Import the database query object
const pool = require('../database_setup/database');

// ===== USER FUNCTIONS =====
// Create new workout routine
router.post('/users/:user_id/workouts', async (req, res) => {
    const { user_id } = req.params;
    const { name, exercises } = req.body;
  
    try {
      // Insert the workout and retrieve its workout_id
      const workoutResult = await pool.query(
        'INSERT INTO Workouts (user_id, name) VALUES ($1, $2) RETURNING workout_id',
        [user_id, name]
      );
      const workoutId = workoutResult.rows[0].workout_id;
  
      // Insert the exercises
      for (const exercise of exercises) {
        await pool.query(
          'INSERT INTO Exercises (workout_id, name) VALUES ($1, $2)',
          [workoutId, exercise.name]
        );
      }
  
      res.status(201).send('Workout created successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to create workout');
    }
});

// Get all workouts belonging to a certain user
router.get('/users/:user_id/workouts', async (req, res) => {
	const { user_id } = req.params;

	try {
		const result = await pool.query('SELECT * FROM Workouts WHERE user_id = $1', [user_id]);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Error fetching this user\'s workouts');
	}
});

// Get all exercises belonging to a certain workout
router.get('/workouts/:workout_id/exercises', async (req, res) => {
	const { workout_id } = req.params;

	try {
		const result = await pool.query('SELECT * FROM Exercises WHERE workout_id = $1', [workout_id]);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Error fetching this user\'s exercises');
	}
});

// Modify workout
router.put('/workouts/:workout_id', async (req, res) => {
	const { workout_id } = req.params;
	const { name, exercises } = req.body;

	try {
		await pool.query('BEGIN');
		// Modify name and return the workouts object
		const result = await pool.query('UPDATE Workouts SET name = $1 WHERE workout_id = $2 RETURNING *', [name, workout_id]);

		// Only update exercises if they are included in the request
		if (exercises) {
			// Delete existing exercises for this workout
			await pool.query('DELETE FROM Exercises WHERE workout_id = $1', [workout_id]);

			// Insert new exercises into the workout
			for (const exercise of exercises) {
				await pool.query(
					'INSERT INTO Exercises (workout_id, name) VALUES ($1, $2)', [workout_id, exercise.name]);
			}
		}
	
		res.status(200).send('Workout modified successfully');
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Failed to modify workout');
	}
});

// Delete workout
router.delete('/workouts/:workout_id', async (req, res) => {
	const { workout_id } = req.params;

	try {
		await pool.query('DELETE FROM Workouts WHERE workout_id = $1', [workout_id]);
		res.status(200).send('Workout successfully deleted');
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Failed to delete workout');
	}
});

// ===== ADMIN FUNCTIONS =====
// Get all workouts
router.get('/workouts/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Workouts');
        res.send(result.rows);
     } catch (error) {
         console.error(error.message);
         res.status(500).send('Error fetching workouts');
     }
});

// Get all exercises
router.get('/exercises', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Exercises');
        res.send(result.rows);
     } catch (error) {
         console.error(error.message);
         res.status(500).send('Error fetching exercises');
     }
});

module.exports = router;