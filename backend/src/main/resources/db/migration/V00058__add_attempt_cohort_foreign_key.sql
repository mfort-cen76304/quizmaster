ALTER TABLE attempt
    ADD CONSTRAINT fk_attempt_cohort
    FOREIGN KEY (cohort_id)
    REFERENCES cohort(id)
    ON DELETE SET NULL;