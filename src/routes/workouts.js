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
		// Beginning of transaction
		await pool.query('BEGIN');
		// Modify name and return the workouts object
		const result = await pool.query('UPDATE Workouts SET name = $1 WHERE workout_id = $2 RETURNING *', [name, workout_id]);

		// Only update exercises if they are included in the request
		if (exercises) {
			// Get names and ids of exercises already in the database
			const existingExercises = await pool.query('SELECT exercise_id, name FROM exercises WHERE workout_id = $1', [workout_id]);

			// Get names of exercises to keep from user's request
			const exercisesToKeep = exercises.map((exercise) => exercise.name);


			// Delete all exercises that don't have a name match between the user's request and what's already in the db
			const exercisesToDelete = existingExercises.rows.filter((exercise) => !exercisesToKeep.includes(exercise.name));
			for (const exercise of exercisesToDelete) {
				await pool.query('DELETE FROM exercises WHERE exercise_id = $1', [exercise.exercise_id]);
			}

			// Insert the remaining exercises from the user's request
			for (const exercise of exercises) {

				// Does this exercise already exist?
				const existingExercise = existingExercises.rows.find((ex) => ex.name === exercise.name);

				// If not, insert it
				if (!existingExercise) {
					await pool.query('INSERT INTO exercises (workout_id, name) VALUES ($1, $2)', [workout_id, exercise.name]);
				}
			}
		}
		// Ends transaction
		await pool.query('COMMIT');
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

// Get workout summary
router.get('/workout-summary/:user_id', async (req, res) => {
	const { user_id } = req.params;

	try {
		const result = await pool.query(`
			SELECT
				w.name AS workout_name,
				e.name AS exercise_name,
				s.weight,
				s.reps
			FROM
				Workouts w
				INNER JOIN Exercises e ON w.workout_id = e.workout_id
				INNER JOIN Sets s ON e.exercise_id = s.exercise_id
			WHERE
				w.user_id = $1
				AND w.created_at = (
					SELECT MAX(created_at)
					FROM Workouts
					WHERE user_id = $1
				)
				AND s.created_at >= NOW() - INTERVAL '12 hours'
			ORDER BY
				e.name, s.created_at;
		`, [user_id]);
		res.status(200).json(result.rows);
	}
	catch (error) {
		console.error(error.message);
		res.status(500).send('Failed to get workout summary')
	}
})

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