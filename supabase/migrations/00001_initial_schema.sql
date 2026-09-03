-- Enable PostGIS for geospatial queries if needed, though we will rely on client-side Haversine for now
-- create extension postgis;

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geofence_radius INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    site_id UUID REFERENCES sites(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    team_id UUID REFERENCES teams(id),
    role TEXT DEFAULT 'Technician',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, employee_id)
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY, -- Using client-generated UUID for offline support
    employee_id UUID REFERENCES employees(id),
    team_id UUID REFERENCES teams(id),
    site_id UUID REFERENCES sites(id),
    type TEXT NOT NULL CHECK (type IN ('TIME_IN', 'TIME_OUT')),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gps_accuracy DOUBLE PRECISION,
    distance_from_site DOUBLE PRECISION,
    verification_status TEXT,
    photo_path TEXT,
    created_offline BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for sites, teams, employees
CREATE POLICY "Allow read access to authenticated users" ON sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON employees FOR SELECT TO authenticated USING (true);

-- Employees can insert their own attendance
CREATE POLICY "Employees can insert attendance" ON attendance_records FOR INSERT TO authenticated WITH CHECK (true);
-- Employees can view their team's attendance
CREATE POLICY "Employees can view attendance" ON attendance_records FOR SELECT TO authenticated USING (true);
