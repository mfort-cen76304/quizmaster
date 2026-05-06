ALTER TABLE question ADD COLUMN embedding double precision[];
ALTER TABLE question ADD COLUMN embedding_model varchar(100);
ALTER TABLE question ADD COLUMN embedding_text_hash varchar(64);
