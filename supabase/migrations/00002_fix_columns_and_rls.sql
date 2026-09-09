-- Migration: Fix Schema, RLS Policies & Storage Access
-- Execute this entire file in your Supabase SQL Editor

-- 1. Ensure all columns exist on tables
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS team_name TEXT,
  ADD COLUMN IF NOT EXISTS members_present JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_name TEXT;

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;


-- 2. Create 'user_profile' storage bucket if it doesn't exist, and make it public
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_profile', 'user_profile', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- 3. Safely Drop Existing RLS Policies before Re-creating (Avoids 42710 policy already exists errors)

-- attendance_records
DROP POLICY IF EXISTS "Allow all for public attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Employees can insert attendance" ON attendance_records;
DROP POLICY IF EXISTS "Employees can view attendance" ON attendance_records;
CREATE POLICY "Allow all for public attendance_records" ON attendance_records FOR ALL TO public USING (true) WITH CHECK (true);

-- teams
DROP POLICY IF EXISTS "Allow all for public teams" ON teams;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON teams;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON teams;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON teams;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON teams;
CREATE POLICY "Allow all for public teams" ON teams FOR ALL TO public USING (true) WITH CHECK (true);

-- employees
DROP POLICY IF EXISTS "Allow all for public employees" ON employees;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON employees;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON employees;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON employees;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON employees;
CREATE POLICY "Allow all for public employees" ON employees FOR ALL TO public USING (true) WITH CHECK (true);

-- sites
DROP POLICY IF EXISTS "Allow all for public sites" ON sites;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON sites;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON sites;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON sites;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON sites;
CREATE POLICY "Allow all for public sites" ON sites FOR ALL TO public USING (true) WITH CHECK (true);

-- team_members (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "Allow all for public team_members" ON team_members';
    EXECUTE 'CREATE POLICY "Allow all for public team_members" ON team_members FOR ALL TO public USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- storage.objects (For photo uploads)
DROP POLICY IF EXISTS "Allow public uploads to user_profile" ON storage.objects;
CREATE POLICY "Allow public uploads to user_profile" ON storage.objects FOR ALL TO public USING (bucket_id = 'user_profile') WITH CHECK (bucket_id = 'user_profile');


-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
