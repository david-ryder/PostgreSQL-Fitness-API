const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const userRouter = require("./routes/user");
const workoutExercisesRouter = require("./routes/workouts");
const setsRouter = require("./routes/sets");

// import the database query object
const pool = require("./database_setup/database");

// use json
app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

app.use(userRouter);
app.use(workoutExercisesRouter);
app.use(setsRouter);

// Setup app listener
function startAPI() {
    app.listen(port, () => {
        console.log(`API running on port: ${port}`);
    });
}

startAPI();

let retries = 5;
