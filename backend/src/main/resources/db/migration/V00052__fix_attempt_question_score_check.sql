ALTER TABLE attempt_question_score
    DROP CONSTRAINT attempt_question_score_score_check;

ALTER TABLE attempt_question_score
    ADD CONSTRAINT attempt_question_score_score_check
    CHECK (score IN ('CORRECT', 'PARTIAL', 'INCORRECT'));
