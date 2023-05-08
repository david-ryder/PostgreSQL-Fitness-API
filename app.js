const express = require('express');
const app = express();
const port = 3000;
const userRouter = require('./routes/user');
const workoutExercisesRouter = require('./routes/workouts');
const setsRouter = require('./routes/sets');

// import the database query object
const pool = require('./database_setup/database');

// use json
app.use(express.json());
app.use(userRouter);
app.use(workoutExercisesRouter);
app.use(setsRouter);

// Setup app listener
app.listen(port, () => {
    console.log(`API running on port: ${port}`);
});