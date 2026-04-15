-- Mark specific enquiries as COMPLETED
-- Run: mysql -u root -p air_ambulance_db < scripts/mark_enquiries_completed.sql

UPDATE enquiries
SET status = 'COMPLETED', updated_at = NOW()
WHERE enquiry_id IN (21, 22, 23, 24, 25);

-- Verify
SELECT enquiry_id, enquiry_code, patient_name, status
FROM enquiries
WHERE enquiry_id IN (21, 22, 23, 24, 25)
ORDER BY enquiry_id;
