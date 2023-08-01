// Set up database query object
const { Pool } = require("pg");

// Instantiate db query object with credentials to access the database
const pool = new Pool({
    host: "host.docker.internal",
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: process.env.POSTGRES_PORT,
});

const createSchemas = async () => {
    try {
        await pool.query(`
            -- create the Users table
            CREATE TABLE IF NOT EXISTS Users (
                user_id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
            -- create the Workouts table
            CREATE TABLE IF NOT EXISTS Workouts  (
                workout_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                name VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );
            -- create the Exercises table
            CREATE TABLE IF NOT EXISTS Exercises (
                exercise_id SERIAL PRIMARY KEY,
                workout_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                name VARCHAR(50) NOT NULL,
                current_weight INTEGER NOT NULL,
                target_sets INTEGER NOT NULL,
                target_reps INTEGER NOT NULL,
                weight_modifier INTEGER NOT NULL,
                FOREIGN KEY (workout_id) REFERENCES Workouts(workout_id) ON DELETE CASCADE
            );
            -- create the Sets table
            CREATE TABLE IF NOT EXISTS Sets (
                set_id SERIAL PRIMARY KEY,
                exercise_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                weight INTEGER NOT NULL,
                reps INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (exercise_id) REFERENCES Exercises(exercise_id) ON DELETE CASCADE
            );
        `);
        console.log("SQL script executed successfully");
    } catch (error) {
        console.error("Error executing SQL script:", error.message);
    }
};

// Connects to database
function connectToDatabase() {
    pool.connect((error) => {
        if (error) {
            console.error("Error connecting to database:", error.message, new Date());
            retryConnection();
        } else {
            console.log("Successfully connected to database");
            createSchemas();
        }
    });
}

// 5 chances to connect to database, 2 second intervals
let retries = 5;
function retryConnection() {
    const tryConnect = () => {
        if (retries === 0) {
            console.log("Exhausted connection retries");
            return;
        }

        console.log(`Retries left: ${retries}`);
        setTimeout(() => {
            connectToDatabase();
        }, 5000);

        retries--;
    };

    tryConnect();
}

// Connect to the database, create schema
retryConnection();

// Export the object so we can access it in other parts of the app
module.exports = pool;
