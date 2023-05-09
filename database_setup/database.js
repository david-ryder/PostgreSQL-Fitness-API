// Set up database query object
const Pool = require('pg').Pool;

// Instantiate db query object with credentials to access the database
const pool = new Pool({
    user: "postgres",
    password: "david",
    database: "fitness_db",
    host: "localhost",
    port: 5432
});

// Export the object so we can access it in other parts of the app
module.exports = pool;