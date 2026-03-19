-- Create referral_authorities master table
CREATE TABLE IF NOT EXISTS referral_authorities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  designation VARCHAR(150) NOT NULL,
  type ENUM('PHYSICIAN', 'RECOMMENDING', 'APPROVAL') NOT NULL,
  hospital_id BIGINT NULL,
  district_id BIGINT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE SET NULL,
  FOREIGN KEY (district_id) REFERENCES districts(district_id) ON DELETE SET NULL
);

-- Index for fast search
CREATE INDEX idx_ra_type ON referral_authorities(type);
CREATE INDEX idx_ra_name ON referral_authorities(name);
