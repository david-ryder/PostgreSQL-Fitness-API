const { exec } = require("child_process");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const userRouter = require("./routes/user");
const workoutExercisesRouter = require("./routes/workouts");
const setsRouter = require("./routes/sets");

const runCommand = () => {
    const child = exec("npx localtunnel --port 3000");

    // Capture the command output
    child.stdout.on("data", (data) => {
        console.log(data); // Output the data to the console
    });

    // Handle any error that occurs
    child.on("error", (err) => {
        console.error(err);
    });
};

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
        runCommand();
    });
}

startAPI();

let retries = 5;
