CREATE TABLE cohort (
    id SERIAL PRIMARY KEY,
    guid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    quiz_id INTEGER NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    CONSTRAINT cohort_name_unique_per_quiz UNIQUE (quiz_id, name)
);
