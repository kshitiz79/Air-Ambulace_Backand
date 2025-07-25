-- Ambulance Management Schema
-- Add this to your existing database

-- Create ambulances table (simplified)
CREATE TABLE IF NOT EXISTS `ambulances` (
  `ambulance_id` varchar(50) NOT NULL,
  `aircraft_type` varchar(100) NOT NULL,
  `registration_number` varchar(50) NOT NULL UNIQUE,
  `status` enum('AVAILABLE','IN_USE','MAINTENANCE','OUT_OF_SERVICE') DEFAULT 'AVAILABLE',
  `base_location` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ambulance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores air ambulance fleet information';

-- Update flight_assignments table to add foreign key constraint
ALTER TABLE `flight_assignments` 
ADD CONSTRAINT `flight_assignments_ambulance_fk` 
FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`ambulance_id`) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert sample ambulance data (simplified)
INSERT INTO `ambulances` (`ambulance_id`, `aircraft_type`, `registration_number`, `status`, `base_location`) VALUES
('AA-001', 'Helicopter - Bell 429', 'VT-ABC001', 'AVAILABLE', 'Bhopal Airport'),
('AA-002', 'Fixed Wing - Beechcraft King Air', 'VT-DEF002', 'AVAILABLE', 'Indore Airport'),
('AA-003', 'Helicopter - Airbus H145', 'VT-GHI003', 'MAINTENANCE', 'Jabalpur Airport'),
('AA-004', 'Fixed Wing - Cessna Citation', 'VT-JKL004', 'AVAILABLE', 'Gwalior Airport'),
('AA-005', 'Helicopter - Bell 407', 'VT-MNO005', 'OUT_OF_SERVICE', 'Ujjain Helipad');

-- Create index for better performance
CREATE INDEX idx_ambulance_status ON ambulances(status);
CREATE INDEX idx_ambulance_location ON ambulances(base_location);
CREATE INDEX idx_flight_assignment_ambulance ON flight_assignments(ambulance_id);