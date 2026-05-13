ALTER TABLE attempt_question_score DROP CONSTRAINT IF EXISTS attempt_question_score_score_check;
ALTER TABLE attempt_question_score DROP COLUMN score;
