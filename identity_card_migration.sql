-- Migration script to add identity_card_type field to enquiries table
-- This script adds support for ABHA/PM JAY dropdown functionality

-- Step 1: Add the identity_card_type column
ALTER TABLE `enquiries` 
ADD COLUMN `identity_card_type` enum('ABHA','PM_JAY') DEFAULT NULL 
AFTER `address`;

-- Step 2: Update the ayushman_card_number column to support both ABHA (14 digits) and PM JAY (9 digits)
-- The existing varchar(20) is sufficient for both, but let's add a comment for clarity
ALTER TABLE `enquiries` 
MODIFY COLUMN `ayushman_card_number` varchar(20) DEFAULT NULL 
COMMENT 'Stores ABHA Number (14 digits) or PM JAY ID (9 digits) based on identity_card_type';

-- Step 3: Drop the existing constraint that requires either ayushman_card_number or both aadhar+pan
ALTER TABLE `enquiries` 
DROP CONSTRAINT `chk_ayushman_or_aadhar_pan`;

-- Step 4: Add new constraint that handles the ABHA/PM JAY logic
ALTER TABLE `enquiries` 
ADD CONSTRAINT `chk_identity_card_validation` 
CHECK (
  (
    -- Case 1: ABHA selected - must have ayushman_card_number with 14 digits
    (`identity_card_type` = 'ABHA' AND `ayushman_card_number` IS NOT NULL AND CHAR_LENGTH(`ayushman_card_number`) = 14 AND `ayushman_card_number` REGEXP '^[0-9]{14}$')
  ) OR (
    -- Case 2: PM_JAY selected - must have ayushman_card_number with 9 digits  
    (`identity_card_type` = 'PM_JAY' AND `ayushman_card_number` IS NOT NULL AND CHAR_LENGTH(`ayushman_card_number`) = 9 AND `ayushman_card_number` REGEXP '^[0-9]{9}$')
  ) OR (
    -- Case 3: No identity_card_type selected - must have both aadhar and pan
    (`identity_card_type` IS NULL AND `aadhar_card_number` IS NOT NULL AND `pan_card_number` IS NOT NULL)
  )
);

-- Step 5: Add index for better performance on identity_card_type queries
CREATE INDEX `idx_enquiry_identity_type` ON `enquiries` (`identity_card_type`);

-- Step 6: Update table comment to reflect new functionality
ALTER TABLE `enquiries` 
COMMENT = 'Stores air ambulance enquiry details with support for ABHA/PM JAY identity cards';

-- Optional: Add some sample data validation queries to test the constraints
-- Uncomment these to test after running the migration

/*
-- Test Case 1: Valid ABHA entry (should work)
INSERT INTO `enquiries` (
  `patient_name`, `identity_card_type`, `ayushman_card_number`, 
  `father_spouse_name`, `age`, `gender`, `address`, `chief_complaint`, 
  `general_condition`, `vitals`, `medical_condition`, `hospital_id`, 
  `source_hospital_id`, `contact_name`, `contact_phone`, `contact_email`, 
  `submitted_by_user_id`, `district_id`, `referring_physician_name`, 
  `referring_physician_designation`, `transportation_category`, 
  `air_transport_type`, `recommending_authority_name`, 
  `recommending_authority_designation`, `approval_authority_name`, 
  `approval_authority_designation`
) VALUES (
  'Test Patient', 'ABHA', '12345678901234', 'Test Father', 30, 'Male', 
  'Test Address', 'Test Complaint', 'Stable', 'Stable', 'Test Condition', 
  1, 1, 'Test Contact', '9876543210', 'test@example.com', 1, 1, 
  'Dr. Test', 'Physician', 'Within Division', 'Free', 'Authority Name', 
  'Authority Designation', 'Approval Name', 'Approval Designation'
);

-- Test Case 2: Valid PM JAY entry (should work)
INSERT INTO `enquiries` (
  `patient_name`, `identity_card_type`, `ayushman_card_number`, 
  `father_spouse_name`, `age`, `gender`, `address`, `chief_complaint`, 
  `general_condition`, `vitals`, `medical_condition`, `hospital_id`, 
  `source_hospital_id`, `contact_name`, `contact_phone`, `contact_email`, 
  `submitted_by_user_id`, `district_id`, `referring_physician_name`, 
  `referring_physician_designation`, `transportation_category`, 
  `air_transport_type`, `recommending_authority_name`, 
  `recommending_authority_designation`, `approval_authority_name`, 
  `approval_authority_designation`
) VALUES (
  'Test Patient 2', 'PM_JAY', '123456789', 'Test Father 2', 25, 'Female', 
  'Test Address 2', 'Test Complaint 2', 'Stable', 'Stable', 'Test Condition 2', 
  1, 1, 'Test Contact 2', '9876543211', 'test2@example.com', 1, 1, 
  'Dr. Test 2', 'Physician', 'Within Division', 'Free', 'Authority Name 2', 
  'Authority Designation 2', 'Approval Name 2', 'Approval Designation 2'
);

-- Test Case 3: Valid Aadhar+PAN entry (should work)
INSERT INTO `enquiries` (
  `patient_name`, `aadhar_card_number`, `pan_card_number`, 
  `father_spouse_name`, `age`, `gender`, `address`, `chief_complaint`, 
  `general_condition`, `vitals`, `medical_condition`, `hospital_id`, 
  `source_hospital_id`, `contact_name`, `contact_phone`, `contact_email`, 
  `submitted_by_user_id`, `district_id`, `referring_physician_name`, 
  `referring_physician_designation`, `transportation_category`, 
  `air_transport_type`, `recommending_authority_name`, 
  `recommending_authority_designation`, `approval_authority_name`, 
  `approval_authority_designation`
) VALUES (
  'Test Patient 3', '123456789012', 'ABCDE1234F', 'Test Father 3', 35, 'Male', 
  'Test Address 3', 'Test Complaint 3', 'Stable', 'Stable', 'Test Condition 3', 
  1, 1, 'Test Contact 3', '9876543212', 'test3@example.com', 1, 1, 
  'Dr. Test 3', 'Physician', 'Within Division', 'Free', 'Authority Name 3', 
  'Authority Designation 3', 'Approval Name 3', 'Approval Designation 3'
);

-- Test Case 4: Invalid ABHA (wrong length - should fail)
INSERT INTO `enquiries` (
  `patient_name`, `identity_card_type`, `ayushman_card_number`, 
  `father_spouse_name`, `age`, `gender`, `address`, `chief_complaint`, 
  `general_condition`, `vitals`, `medical_condition`, `hospital_id`, 
  `source_hospital_id`, `contact_name`, `contact_phone`, `contact_email`, 
  `submitted_by_user_id`, `district_id`, `referring_physician_name`, 
  `referring_physician_designation`, `transportation_category`, 
  `air_transport_type`, `recommending_authority_name`, 
  `recommending_authority_designation`, `approval_authority_name`, 
  `approval_authority_designation`
) VALUES (
  'Test Patient 4', 'ABHA', '123456789', -- Wrong length for ABHA
  'Test Father 4', 40, 'Female', 'Test Address 4', 'Test Complaint 4', 
  'Stable', 'Stable', 'Test Condition 4', 1, 1, 'Test Contact 4', 
  '9876543213', 'test4@example.com', 1, 1, 'Dr. Test 4', 'Physician', 
  'Within Division', 'Free', 'Authority Name 4', 'Authority Designation 4', 
  'Approval Name 4', 'Approval Designation 4'
);
*/