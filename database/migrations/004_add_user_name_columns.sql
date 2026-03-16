-- Backfill missing user profile columns for databases created from older schemas

ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);