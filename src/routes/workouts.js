const express = require("express");
const router = express.Router();

// Import the database query object
const pool = require("../database_setup/database");

// Import JWT functions from auth.js
const { authenticateToken } = require("../auth");

// ===== USER FUNCTIONS =====
// Create new workout routine
router.post("/users/:user_id/workouts", authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    const { name, exercises } = req.body;
    const authenticated_id = req.user.user_id.toString();

    try {
        if (user_id === authenticated_id) {
            // Begin transaction
            await pool.query("BEGIN");

            // Insert the workout and retrieve its workout_id
            const workoutResult = await pool.query(
                "INSERT INTO Workouts (user_id, name) VALUES ($1, $2) RETURNING workout_id",
                [user_id, name]
            );

            const workout_id = workoutResult.rows[0].workout_id;

            // Insert the exercises
            for (const exercise of exercises) {
                await pool.query(
                    "INSERT INTO Exercises (workout_id, user_id, name, current_weight, target_sets, target_reps, weight_modifier) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [
                        workout_id,
                        user_id,
                        exercise.name,
                        exercise.current_weight,
                        exercise.target_sets,
                        exercise.target_reps,
                        exercise.weight_modifier,
                    ]
                );
            }

            // Commit transaction
            await pool.query("COMMIT");

            // Send status message
            res.status(201).send("Workout created successfully");
        } else {
            res.status(403).json(
                "Unauthorized to create workout for this user"
            );
        }
    } catch (err) {
        // Rollback transaction on error
        await pool.query("ROLLBACK");

        console.error(err);
        res.status(500).send("Failed to create workout");
    }
});

// Get all workouts belonging to a certain user
router.get("/users/:user_id/workouts", authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    const authenticated_id = req.user.user_id.toString();

    // user_ids match
    if (user_id === authenticated_id) {
        // try to run the query
        try {
            const result = [];

            const workouts = await pool.query(
                "SELECT * FROM Workouts WHERE user_id = $1",
                [user_id]
            );

            for (const workout of workouts.rows) {
                const exercises = await pool.query(
                    "SELECT * FROM Exercises WHERE workout_id = $1",
                    [workout.workout_id]
                );

                result.push({
                    workout: workout,
                    exercises: exercises.rows
                });
            }

            res.status(200).json(result);
        } catch (error) {
            console.error(error.message);
            res.status(500).json(
                "Failed to get workouts belonging to this user"
            );
        }
    } else {
        res.status(403).json("Unauthorized to get workouts for this user");
    }
});

// Modify workout
router.put("/workouts/:workout_id", authenticateToken, async (req, res) => {
    const { workout_id } = req.params;
    const { name, exercises } = req.body;
    const authenticated_id = req.user.user_id.toString();

    try {
        const userResult = await pool.query("SELECT user_id FROM Workouts WHERE workout_id = $1",
        [workout_id]);

        const user_id = userResult.rows[0].user_id.toString();

        if (user_id === authenticated_id) {
            // Begin transaction
            await pool.query("BEGIN");
    
            // Modify workout name
            if (name) {
                await pool.query(
                    "UPDATE Workouts SET name = $1 WHERE workout_id = $2",
                    [name, workout_id]
                );
            }
    
            // Check if the workout exists
            const workoutExists = await pool.query(
                "SELECT workout_id FROM Workouts WHERE workout_id = $1",
                [workout_id]
            );
    
            if (workoutExists.rowCount === 0) {
                // Workout does not exist, rollback transaction
                await pool.query("ROLLBACK");
                return res.status(404).send("Workout not found");
            }
    
            // Delete all existing exercises for the workout
            await pool.query("DELETE FROM Exercises WHERE workout_id = $1", [
                workout_id,
            ]);
    
            // Insert the updated exercises
            if (exercises && exercises.length > 0) {
                const exerciseValues = exercises.map(
                    (exercise) =>
                        `('${workout_id}', '${user_id}', '${exercise.name}', '${exercise.current_weight}', ${exercise.target_sets}, ${exercise.target_reps}, ${exercise.weight_modifier})`
                );
                const exerciseInsertQuery = `INSERT INTO Exercises (workout_id, user_id, name, current_weight, target_sets, target_reps, weight_modifier) VALUES ${exerciseValues.join(
                    ","
                )}`;
                await pool.query(exerciseInsertQuery);
            }
    
            // Commit transaction
            await pool.query("COMMIT");
            res.status(200).send("Workout modified successfully");
        } else {
            res.status(403).json("Unauthorized to get workouts for this user");
        }
    } catch (error) {
        // Rollback transaction on error
        await pool.query("ROLLBACK");
        console.error(error.message);
        res.status(500).send("Failed to modify workout");
    }
});

// Delete workout
router.delete("/workouts/:workout_id", authenticateToken, async (req, res) => {
    const { workout_id } = req.params;
    const authenticated_id = req.user.user_id.toString();

    try {
        const userResult = await pool.query("SELECT user_id FROM Workouts WHERE workout_id = $1",
        [workout_id]);

        const user_id = userResult.rows[0].user_id.toString();

        if (user_id === authenticated_id) {
            await pool.query("DELETE FROM Workouts WHERE workout_id = $1", [
                workout_id,
            ]);
            res.status(200).send("Workout successfully deleted");
        } else {
            res.status(403).json("Unauthorized to get workouts for this user");
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Failed to delete workout");
    }
});

// Get workout summary - all sets and exercises for past 12 hours
router.get("/workout-summary/:user_id", authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    const authenticated_id = req.user.user_id.toString();

    if (user_id === authenticated_id) {
        try {
            const result = await pool.query(
                `
                SELECT
                    w.workout_id AS workout_id,
                    w.name AS workout_name,
                    e.exercise_id AS exercise_id,
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
            `,
                [user_id]
            );
            res.status(200).json(result.rows);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Failed to get workout summary");
        }
    } else {
        res.status(403).json(
            "Unauthorized to create workout for this user"
        );
    }
});

// Get all exercises eligible for progression
router.get("/workout-summary/progression/:user_id", authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    const authenticated_id = req.user.user_id.toString();

    if (user_id === authenticated_id) {
        try {
            // Get all sets completed within past 12 hours
            const sets = await pool.query(
                `
                SELECT Sets.*
                FROM Sets
                INNER JOIN Exercises ON Sets.exercise_id = Exercises.exercise_id
                INNER JOIN Workouts ON Exercises.workout_id = Workouts.workout_id
                WHERE
                    Sets.created_at >= NOW() - INTERVAL '12 hours'
                    AND Workouts.user_id = $1
            `,
                [user_id]
            );
    
            const set_ids = sets.rows.map((set) => set.set_id);
            const set_ids_to_string = set_ids.join(",");
    
            // Get all exercises attached to those sets
            const exercises = await pool.query(
                `
                SELECT DISTINCT Exercises.*
                FROM Exercises
                WHERE Exercises.exercise_id IN (
                    SELECT DISTINCT exercise_id
                    FROM Sets
                    WHERE set_id IN (${set_ids_to_string})
                )
                `
            );
    
            const available_exercises = [];
    
            // For each exercise, determine if the goal was met:
            // reps >= target reps
            exercises.rows.forEach((exercise) => {
                const exercise_id = exercise.exercise_id;
                const matching_sets = sets.rows.filter(
                    (set) => set.exercise_id === exercise_id
                );
                const set_count = matching_sets.length;
    
                // Check sets requirement
                if (set_count >= exercise.target_sets) {
                    const is_eligible = matching_sets.every((set) => {
                        return (
                            set.reps >= exercise.target_reps &&
                            set.weight >= exercise.current_weight
                        );
                    });
    
                    if (is_eligible) {
                        available_exercises.push(exercise);
                    }
                }
            });
    
            res.status(200).json(available_exercises);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Failed to get requested information");
        }
    } else {
        res.status(403).json(
            "Unauthorized to create workout for this user"
        );
    }
});

// Update current_weight for specified exercises
router.put("/progression/:user_id", authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    const { exercise_ids } = req.body;
    const authenticated_id = req.user.user_id.toString();

    if (user_id === authenticated_id) {
        try {
            for (const exercise_id in exercise_ids) {
                // Increment the current_weight += weight_modifier
                await pool.query(
                    `
                    UPDATE Exercises
                    SET current_weight = current_weight + (SELECT weight_modifier FROM Exercises WHERE exercise_id = $1)
                    WHERE exercise_id = $1
                `,
                    [exercise_ids[exercise_id]]
                );
            }
            res.status(200).json("Successfully progressed each exercise specified");
        } catch (error) {
            console.error(error.message);
            res.status(500).json("Unable to progress exercises");
        }
    } else {
        res.status(403).json(
            "Unauthorized to create workout for this user"
        );
    }
});

// ===== ADMIN FUNCTIONS =====
// Get all workouts
router.get("/workouts", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM Workouts");
        res.send(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error fetching workouts");
    }
});

// Get all exercises
router.get("/exercises", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM Exercises");
        res.send(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error fetching exercises");
    }
});

module.exports = router;
