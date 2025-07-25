-- Notification System Migration
-- Add this to your existing database

-- First, create the notifications table with the updated schema
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `message` text NOT NULL,
  `type` enum('SMS','EMAIL','IN_APP') NOT NULL DEFAULT 'IN_APP',
  `status` enum('SENT','PENDING','FAILED') DEFAULT 'PENDING',
  `is_read` boolean NOT NULL DEFAULT FALSE,
  `enquiry_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notification_user` (`user_id`),
  KEY `idx_notification_read` (`is_read`),
  KEY `idx_notification_enquiry` (`enquiry_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`enquiry_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores notifications for users';

-- If the table already exists, add the missing columns
ALTER TABLE `notifications` 
ADD COLUMN IF NOT EXISTS `is_read` boolean NOT NULL DEFAULT FALSE AFTER `status`,
ADD COLUMN IF NOT EXISTS `enquiry_id` bigint DEFAULT NULL AFTER `is_read`;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_notification_read` ON `notifications` (`is_read`);
CREATE INDEX IF NOT EXISTS `idx_notification_enquiry` ON `notifications` (`enquiry_id`);

-- Add foreign key constraint for enquiry_id if it doesn't exist
ALTER TABLE `notifications` 
ADD CONSTRAINT `notifications_ibfk_2` 
FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`enquiry_id`) 
ON DELETE SET NULL;

-- Insert sample notifications for testing (optional)
-- Replace user_id values with actual user IDs from your users table
INSERT IGNORE INTO `notifications` (`user_id`, `message`, `type`, `status`, `is_read`, `enquiry_id`) VALUES
(2, 'Welcome to the Air Ambulance System! You will receive notifications about new enquiries and system updates here.', 'IN_APP', 'SENT', FALSE, NULL),
(3, 'System maintenance scheduled for tonight at 2:00 AM. Please save your work.', 'IN_APP', 'SENT', FALSE, NULL);

-- Create a view for notification statistics (optional)
CREATE OR REPLACE VIEW `notification_stats` AS
SELECT 
    u.role,
    COUNT(*) as total_notifications,
    SUM(CASE WHEN n.is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
    SUM(CASE WHEN n.is_read = TRUE THEN 1 ELSE 0 END) as read_count
FROM notifications n
JOIN users u ON n.user_id = u.user_id
GROUP BY u.role;