-- Update User table roles (SUPPORT role will be used as superadmin)
-- This script updates the ENUM values for the role column

-- First, check current table structure
DESCRIBE users;

-- Check current ENUM values
SHOW COLUMNS FROM users LIKE 'role';

-- Update the role column to include all roles (IT_TEAM removed, using SUPPORT as superadmin)
ALTER TABLE users MODIFY COLUMN role ENUM(
    'BENEFICIARY', 
    'CMO', 
    'SDM', 
    'DM', 
    'SERVICE_PROVIDER', 
    'ADMIN', 
    'HOSPITAL', 
    'SUPPORT'
) NOT NULL;

-- Verify the change worked
SHOW COLUMNS FROM users LIKE 'role';

-- Show current users to verify existing data is intact
SELECT user_id, username, role, full_name, email, status FROM users LIMIT 10;