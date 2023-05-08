// setup database query object
const Pool = require('pg').Pool;

// instantiate db query object with credentials to access the database
const pool = new Pool({
    user: "davidwinfield",
    password: "",
    database: "fitness_db",
    host: "localhost",
    port: 5432
});

// export the object so we can access it in other parts of the app
module.exports = pool;