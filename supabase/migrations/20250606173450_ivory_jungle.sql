/*
  # Add missing columns to users table

  1. Schema Updates
    - Add missing columns for student profiles (batch_year, github_url, leetcode_url, department)
    - Add missing columns for alumni profiles (graduation_year, current_job, linkedin_url, is_mentorship_available)
    - Add additional profile columns (skills, avatar_url, resume_url, bio)
    - Ensure all columns have appropriate data types and constraints

  2. Safety
    - Use IF NOT EXISTS checks to prevent errors if columns already exist
    - Set appropriate default values where needed
*/

-- Add missing columns for student profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'batch_year'
  ) THEN
    ALTER TABLE public.users ADD COLUMN batch_year INT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN github_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'leetcode_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN leetcode_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.users ADD COLUMN department TEXT;
  END IF;
END $$;

-- Add missing columns for alumni profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'graduation_year'
  ) THEN
    ALTER TABLE public.users ADD COLUMN graduation_year INT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'current_job'
  ) THEN
    ALTER TABLE public.users ADD COLUMN current_job TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN linkedin_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_mentorship_available'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_mentorship_available BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add additional profile columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'skills'
  ) THEN
    ALTER TABLE public.users ADD COLUMN skills TEXT[];
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN resume_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.users ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Ensure created_at column exists with proper default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add role constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'alumni', 'admin'));
  END IF;
END $$;