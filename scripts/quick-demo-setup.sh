#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-school_mgmt}"

psql -d "$DB_NAME" <<'SQL'
-- Classes and sections for quick demo
INSERT INTO classes (name, sections)
VALUES
  ('Class 1', 'A,B'),
  ('Class 2', 'A,B')
ON CONFLICT (name) DO UPDATE SET sections = EXCLUDED.sections;

INSERT INTO sections (name)
VALUES ('A'), ('B')
ON CONFLICT (name) DO NOTHING;

-- Ensure admin exists and get id
WITH admin_user AS (
  SELECT id FROM users WHERE email = 'admin@school-admin.com' LIMIT 1
),
teacher_upsert AS (
  INSERT INTO users (name, email, role_id, created_dt, is_active, is_email_verified, reporter_id)
  VALUES ('Demo Teacher', 'teacher.demo@school-admin.com', 2, now(), true, true, (SELECT id FROM admin_user))
  ON CONFLICT (email) DO UPDATE
    SET name = EXCLUDED.name,
        role_id = EXCLUDED.role_id,
        is_active = true
  RETURNING id
)
INSERT INTO user_profiles (user_id, gender, phone, class_name, section_name, current_address, permanent_address)
SELECT id, 'Male', '9000000001', 'Class 1', 'A', 'School Campus', 'School Campus'
FROM teacher_upsert
ON CONFLICT (user_id) DO UPDATE
SET class_name = EXCLUDED.class_name,
    section_name = EXCLUDED.section_name,
    phone = EXCLUDED.phone;

-- Map teacher to class
INSERT INTO class_teachers (teacher_id, class_name, section_name)
SELECT u.id, 'Class 1', 'A'
FROM users u
WHERE u.email = 'teacher.demo@school-admin.com'
ON CONFLICT DO NOTHING;

-- Demo students
WITH admin_user AS (
  SELECT id FROM users WHERE email = 'admin@school-admin.com' LIMIT 1
),
student_1 AS (
  INSERT INTO users (name, email, role_id, created_dt, is_active, is_email_verified, reporter_id)
  VALUES ('Alice Student', 'alice.student@school-admin.com', 3, now(), true, true, (SELECT id FROM admin_user))
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, is_active = true
  RETURNING id
),
student_2 AS (
  INSERT INTO users (name, email, role_id, created_dt, is_active, is_email_verified, reporter_id)
  VALUES ('Bob Student', 'bob.student@school-admin.com', 3, now(), true, true, (SELECT id FROM admin_user))
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, is_active = true
  RETURNING id
)
INSERT INTO user_profiles (
  user_id, gender, phone, dob, class_name, section_name, roll, admission_dt,
  father_name, father_phone, mother_name, mother_phone, guardian_name, guardian_phone, relation_of_guardian,
  current_address, permanent_address
)
SELECT id, 'Female', '9000000011', '2012-01-01', 'Class 1', 'A', 1, now()::date,
       'Father A', '9000000101', 'Mother A', '9000000102', 'Guardian A', '9000000103', 'Uncle',
       'Address A', 'Address A'
FROM student_1
ON CONFLICT (user_id) DO UPDATE SET
  class_name = EXCLUDED.class_name,
  section_name = EXCLUDED.section_name,
  roll = EXCLUDED.roll;

WITH admin_user AS (
  SELECT id FROM users WHERE email = 'admin@school-admin.com' LIMIT 1
),
student_2 AS (
  INSERT INTO users (name, email, role_id, created_dt, is_active, is_email_verified, reporter_id)
  VALUES ('Bob Student', 'bob.student@school-admin.com', 3, now(), true, true, (SELECT id FROM admin_user))
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, is_active = true
  RETURNING id
)
INSERT INTO user_profiles (
  user_id, gender, phone, dob, class_name, section_name, roll, admission_dt,
  father_name, father_phone, mother_name, mother_phone, guardian_name, guardian_phone, relation_of_guardian,
  current_address, permanent_address
)
SELECT id, 'Male', '9000000012', '2011-09-14', 'Class 2', 'B', 2, now()::date,
       'Father B', '9000000201', 'Mother B', '9000000202', 'Guardian B', '9000000203', 'Aunt',
       'Address B', 'Address B'
FROM student_2
ON CONFLICT (user_id) DO UPDATE SET
  class_name = EXCLUDED.class_name,
  section_name = EXCLUDED.section_name,
  roll = EXCLUDED.roll;

-- Quick visibility checks
SELECT COUNT(*) AS class_count FROM classes;
SELECT COUNT(*) AS section_count FROM sections;
SELECT COUNT(*) AS student_count FROM users WHERE role_id = 3;
SQL

echo "Quick demo data prepared in database: $DB_NAME"

