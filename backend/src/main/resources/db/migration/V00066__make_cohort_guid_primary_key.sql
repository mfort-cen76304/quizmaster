-- Mirror cohort_id onto attempt as cohort_guid
ALTER TABLE attempt ADD COLUMN cohort_guid TEXT NULL;
UPDATE attempt SET cohort_guid = c.guid FROM cohort c WHERE c.id = attempt.cohort_id;

-- Drop the old attempt FK + index + column
ALTER TABLE attempt DROP CONSTRAINT fk_attempt_cohort;
DROP INDEX IF EXISTS idx_attempt_cohort_id;
ALTER TABLE attempt DROP COLUMN cohort_id;

-- Promote cohort.guid to PK
ALTER TABLE cohort DROP CONSTRAINT cohort_pkey;
ALTER TABLE cohort DROP COLUMN id;
ALTER TABLE cohort ADD PRIMARY KEY (guid);

-- Re-establish attempt → cohort FK on guid
ALTER TABLE attempt ADD CONSTRAINT fk_attempt_cohort
    FOREIGN KEY (cohort_guid) REFERENCES cohort(guid) ON DELETE SET NULL;
CREATE INDEX idx_attempt_cohort_guid ON attempt(cohort_guid);
