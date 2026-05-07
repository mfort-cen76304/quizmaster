CREATE TABLE attempt_question_score (
    id          SERIAL PRIMARY KEY,
    attempt_id  INTEGER NOT NULL REFERENCES attempt(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES question(id),
    score       VARCHAR(16) NOT NULL CHECK (score IN ('correct', 'partial', 'incorrect')),
    answered_at TIMESTAMP NOT NULL,
    UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_attempt_question_score__attempt ON attempt_question_score(attempt_id);
