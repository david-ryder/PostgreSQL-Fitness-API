const express = require('express');
const router = express.Router();

// import the database query object
const pool = require('../database_setup/database');

// create new workout routine
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
  
      res.status(201).json({ message: 'Workout created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to create workout' });
    }
});

// get all workouts
router.get('/workouts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Workouts');
        res.send(result.rows);
     } catch (error) {
         console.error(error.message);
         res.status(500).send('Error fetching workouts');
     }
})

// get all exercises
router.get('/exercises', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Exercises');
        res.send(result.rows);
     } catch (error) {
         console.error(error.message);
         res.status(500).send('Error fetching exercises');
     }
})

module.exports = router;