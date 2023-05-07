CREATE TABLE Sets (
  set_id SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES Exercises(exercise_id)
);