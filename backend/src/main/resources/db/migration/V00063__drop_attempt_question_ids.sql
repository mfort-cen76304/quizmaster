-- Backfill any remaining NULL positions by reassigning all rows in affected attempts,
-- ordered by id. Rows whose attempt already has fully-populated positions are left alone.
WITH renumbered AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY attempt_id ORDER BY id) - 1 AS new_position
    FROM attempt_question_score
    WHERE attempt_id IN (
        SELECT attempt_id FROM attempt_question_score WHERE position IS NULL
    )
)
UPDATE attempt_question_score s
SET position = r.new_position
FROM renumbered r
WHERE s.id = r.id;

ALTER TABLE attempt_question_score ALTER COLUMN position SET NOT NULL;

CREATE UNIQUE INDEX idx_attempt_question_score__attempt_position
    ON attempt_question_score(attempt_id, position);

ALTER TABLE attempt DROP COLUMN question_ids;
