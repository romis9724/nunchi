-- Migration 004: Beta schema — users.role, users onboarding columns, inquiries table
-- AC 3 (admin access), AC 7-9 (onboarding), AC 17 (contact/inquiries)

-- 1. Add role column to users table (admin | user)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'user'));

-- 2. Add onboarding columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company        TEXT,
  ADD COLUMN IF NOT EXISTS brand          TEXT,
  ADD COLUMN IF NOT EXISTS product_name   TEXT,
  ADD COLUMN IF NOT EXISTS industries     TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS channels       TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- 3. Add status + source columns to events (for admin CRUD + news automation)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'archived')),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'naver_auto'));

-- 4. Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RLS policies
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert inquiries (/contact is public)
CREATE POLICY "inquiries_insert_public"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Only admins can read all inquiries
CREATE POLICY "inquiries_select_admin"
  ON inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Admins can read/write all events regardless of status
CREATE POLICY "events_admin_all"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
