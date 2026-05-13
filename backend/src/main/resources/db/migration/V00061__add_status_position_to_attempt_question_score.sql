ALTER TABLE attempt_question_score
    ADD COLUMN status VARCHAR(16),
    ADD COLUMN position INT;

-- Backfill status from existing score values (CORRECT/PARTIAL/INCORRECT match 1:1)
UPDATE attempt_question_score SET status = score;

-- Backfill position from the originating attempt.question_ids array index (0-based)
UPDATE attempt_question_score s
SET position = q.ordinal - 1
FROM attempt a, unnest(a.question_ids) WITH ORDINALITY AS q(question_id, ordinal)
WHERE s.attempt_id = a.id
  AND s.question_id = q.question_id;

-- Placeholders will carry NULL score and answered_at until the question is answered
ALTER TABLE attempt_question_score ALTER COLUMN score DROP NOT NULL;
ALTER TABLE attempt_question_score ALTER COLUMN answered_at DROP NOT NULL;

-- Seed UNANSWERED placeholder rows for every (attempt, question) pair that has no score row yet
INSERT INTO attempt_question_score (attempt_id, question_id, status, position, score, answered_at)
SELECT a.id, q.question_id, 'UNANSWERED', q.ordinal - 1, NULL, NULL
FROM attempt a
CROSS JOIN LATERAL unnest(a.question_ids) WITH ORDINALITY AS q(question_id, ordinal)
WHERE NOT EXISTS (
    SELECT 1 FROM attempt_question_score s
    WHERE s.attempt_id = a.id AND s.question_id = q.question_id
);

ALTER TABLE attempt_question_score
    ALTER COLUMN status SET NOT NULL,
    ADD CONSTRAINT attempt_question_score_status_check
        CHECK (status IN ('CORRECT', 'PARTIAL', 'INCORRECT', 'UNANSWERED'));
