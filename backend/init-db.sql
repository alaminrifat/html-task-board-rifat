-- TaskBoard Database Initialization
-- Runs automatically when PostgreSQL container starts for the first time

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (TypeORM migrations will handle tables)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('PROJECT_OWNER', 'TEAM_MEMBER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_role AS ENUM ('OWNER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('TASK_ASSIGNED', 'DUE_DATE_REMINDER', 'STATUS_CHANGE', 'COMMENT_MENTION', 'NEW_COMMENT', 'INVITATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE board_template AS ENUM ('DEFAULT', 'MINIMAL', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE time_entry_type AS ENUM ('TIMER', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE digest_frequency AS ENUM ('OFF', 'DAILY', 'WEEKLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_action AS ENUM (
    'TASK_CREATED', 'TASK_UPDATED', 'TASK_MOVED', 'TASK_DELETED', 'TASK_RESTORED',
    'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED',
    'MEMBER_ADDED', 'MEMBER_REMOVED',
    'COLUMN_CREATED', 'COLUMN_UPDATED', 'COLUMN_DELETED',
    'PROJECT_UPDATED', 'PROJECT_ARCHIVED',
    'SUB_TASK_ADDED', 'SUB_TASK_COMPLETED', 'TIME_LOGGED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables will be created by TypeORM migrations: npm run migration:run
