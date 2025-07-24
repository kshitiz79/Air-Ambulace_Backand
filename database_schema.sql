-- Air Ambulance Database Schema
-- This script creates all necessary tables for the Air Ambulance system

-- Create invoices table (matches existing schema)
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoice_id` bigint NOT NULL AUTO_INCREMENT,
  `enquiry_id` bigint NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `invoice_date` date NOT NULL,
  `status` enum('PENDING','PAID') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`invoice_id`),
  KEY `enquiry_id` (`enquiry_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`enquiry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores invoices under Ayushman Bharat scheme';

-- Create case_closures table
CREATE TABLE IF NOT EXISTS `case_closures` (
  `closure_id` bigint NOT NULL AUTO_INCREMENT,
  `enquiry_id` bigint NOT NULL,
  `closure_reason` enum('SERVICE_COMPLETED','PATIENT_TRANSFERRED','DOCUMENTATION_COMPLETE','PAYMENT_CLEARED') NOT NULL,
  `final_remarks` text NOT NULL,
  `documents_submitted` tinyint(1) DEFAULT '0',
  `payment_cleared` tinyint(1) DEFAULT '0',
  `patient_feedback` text,
  `closure_notes` text,
  `closure_status` enum('PENDING','CLOSED','REJECTED') DEFAULT 'PENDING',
  `closed_by` bigint NOT NULL,
  `closure_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`closure_id`),
  KEY `enquiry_id` (`enquiry_id`),
  KEY `closed_by` (`closed_by`),
  CONSTRAINT `case_closures_ibfk_1` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`enquiry_id`),
  CONSTRAINT `case_closures_ibfk_2` FOREIGN KEY (`closed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores case closure information';

-- Update flight_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS `flight_assignments` (
  `assignment_id` bigint NOT NULL AUTO_INCREMENT,
  `enquiry_id` bigint NOT NULL,
  `ambulance_id` varchar(50) DEFAULT NULL,
  `crew_details` text,
  `departure_time` datetime DEFAULT NULL,
  `arrival_time` datetime DEFAULT NULL,
  `status` enum('ASSIGNED','IN_PROGRESS','COMPLETED') DEFAULT 'ASSIGNED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `enquiry_id` (`enquiry_id`),
  CONSTRAINT `flight_assignments_ibfk_1` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`enquiry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores air ambulance assignments';

-- Update post_operation_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS `post_operation_reports` (
  `report_id` bigint NOT NULL AUTO_INCREMENT,
  `enquiry_id` bigint NOT NULL,
  `flight_log` text,
  `patient_transfer_status` enum('SUCCESSFUL','FAILED') NOT NULL,
  `remarks` text,
  `submitted_by_user_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `enquiry_id` (`enquiry_id`),
  KEY `submitted_by_user_id` (`submitted_by_user_id`),
  CONSTRAINT `post_operation_reports_ibfk_1` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`enquiry_id`),
  CONSTRAINT `post_operation_reports_ibfk_2` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores post-operation reports';

-- Insert sample data for testing (optional)
-- You can uncomment these lines to add sample data

/*
-- Sample flight assignments
INSERT INTO `flight_assignments` (`enquiry_id`, `ambulance_id`, `crew_details`, `departure_time`, `arrival_time`, `status`) VALUES
(1, 'AA-001', 'Pilot: John Smith, Medic: Jane Doe', '2024-01-15 10:30:00', '2024-01-15 12:45:00', 'COMPLETED'),
(2, 'AA-002', 'Pilot: Mike Johnson, Medic: Sarah Wilson', '2024-01-15 14:00:00', NULL, 'IN_PROGRESS');

-- Sample post-operation reports
INSERT INTO `post_operation_reports` (`enquiry_id`, `flight_log`, `patient_transfer_status`, `remarks`, `submitted_by_user_id`) VALUES
(1, 'Flight departed at 10:30 AM, smooth journey, landed safely at 12:45 PM', 'SUCCESSFUL', 'Patient stable throughout the journey. No complications.', 1);

-- Sample invoices
INSERT INTO `invoices` (`invoice_id`, `enquiry_id`, `patient_name`, `service_type`, `base_amount`, `distance_charges`, `medical_equipment_charges`, `crew_charges`, `fuel_charges`, `additional_charges`, `subtotal`, `discount_percentage`, `discount_amount`, `tax_percentage`, `tax_amount`, `final_amount`, `status`, `due_date`, `created_by`) VALUES
('INV-2024-001', 1, 'John Doe', 'Air Ambulance', 100000.00, 15000.00, 5000.00, 8000.00, 12000.00, 2000.00, 142000.00, 5.00, 7100.00, 18.00, 24282.00, 159182.00, 'PENDING', '2024-02-15 23:59:59', 1);

-- Sample case closures
INSERT INTO `case_closures` (`enquiry_id`, `closure_reason`, `final_remarks`, `documents_submitted`, `payment_cleared`, `patient_feedback`, `closure_notes`, `closure_status`, `closed_by`, `closure_date`) VALUES
(1, 'SERVICE_COMPLETED', 'Service completed successfully. Patient transferred safely.', 1, 1, 'Excellent service, very professional crew.', 'All documentation complete and verified.', 'CLOSED', 1, '2024-01-16 10:00:00');
*/