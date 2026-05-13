ALTER TABLE attempt ADD COLUMN cohort_id INTEGER NULL;

CREATE INDEX idx_attempt_cohort_id ON attempt(cohort_id);