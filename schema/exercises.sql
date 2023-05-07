CREATE TABLE Exercises (
  exercise_id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (workout_id) REFERENCES Workouts(workout_id)
);