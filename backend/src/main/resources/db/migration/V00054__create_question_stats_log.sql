CREATE TABLE question_event_type (
    code VARCHAR(32) PRIMARY KEY,
    description TEXT
);

INSERT INTO question_event_type (code, description) VALUES
  ('ABANDONED', 'Otázka nebyla zobrazena ani zodpovězena'),
  ('VIEWED', 'Otázka zobrazena'),
  ('ANSWERED', 'Otázka zodpovězena'),
  ('SKIPPED', 'Otázka přeskočena');

CREATE TABLE question_stats_log (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quiz(id) ON DELETE SET NULL,
    attempt_id INTEGER REFERENCES attempt(id) ON DELETE SET NULL,
    user_id INTEGER,
    event_type VARCHAR(32) NOT NULL REFERENCES question_event_type(code),
    event_detail JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_stats_log__question_id ON question_stats_log(question_id);
CREATE INDEX idx_question_stats_log__quiz_id ON question_stats_log(quiz_id);
CREATE INDEX idx_question_stats_log__attempt_id ON question_stats_log(attempt_id);
CREATE INDEX idx_question_stats_log__user_id ON question_stats_log(user_id);
CREATE INDEX idx_question_stats_log__event_type ON question_stats_log(event_type);