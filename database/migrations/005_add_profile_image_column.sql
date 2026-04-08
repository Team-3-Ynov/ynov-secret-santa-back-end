-- Add strict profile_image support with canonical avatar paths

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(64);

-- Canonicalize historical values and ensure every row has a safe default.
UPDATE users
SET profile_image = CASE
  WHEN profile_image = 'avatar-1' THEN '/avatars/avatar-1.svg'
  WHEN profile_image = 'avatar-2' THEN '/avatars/avatar-2.svg'
  WHEN profile_image = 'avatar-3' THEN '/avatars/avatar-3.svg'
  WHEN profile_image = 'avatar-4' THEN '/avatars/avatar-4.svg'
  WHEN profile_image = 'avatar-5' THEN '/avatars/avatar-5.svg'
  WHEN profile_image IN (
    '/avatars/avatar-1.svg',
    '/avatars/avatar-2.svg',
    '/avatars/avatar-3.svg',
    '/avatars/avatar-4.svg',
    '/avatars/avatar-5.svg'
  ) THEN profile_image
  ELSE '/avatars/avatar-1.svg'
END;

ALTER TABLE users
ALTER COLUMN profile_image SET DEFAULT '/avatars/avatar-1.svg';

ALTER TABLE users
ALTER COLUMN profile_image SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_profile_image_allowed_check'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_profile_image_allowed_check
      CHECK (
        profile_image IN (
          '/avatars/avatar-1.svg',
          '/avatars/avatar-2.svg',
          '/avatars/avatar-3.svg',
          '/avatars/avatar-4.svg',
          '/avatars/avatar-5.svg'
        )
      );
  END IF;
END $$;

