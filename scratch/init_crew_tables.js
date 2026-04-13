
const sequelize = require('../src/config/database');

const createTables = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    console.log('Creating crew_members table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crew_members (
        crew_id bigint NOT NULL AUTO_INCREMENT,
        full_name varchar(100) NOT NULL,
        role enum('PILOT', 'DOCTOR', 'NURSE', 'PARAMEDIC', 'OTHER') NOT NULL,
        phone varchar(15) DEFAULT NULL,
        email varchar(100) DEFAULT NULL,
        license_number varchar(50) DEFAULT NULL,
        status enum('AVAILABLE', 'ON_FLIGHT', 'OFF_DUTY') DEFAULT 'AVAILABLE',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (crew_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating flight_crew_assignments table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS flight_crew_assignments (
        id bigint NOT NULL AUTO_INCREMENT,
        assignment_id bigint NOT NULL,
        crew_id bigint NOT NULL,
        PRIMARY KEY (id),
        KEY assignment_id (assignment_id),
        KEY crew_id (crew_id),
        CONSTRAINT flight_crew_assignments_ibfk_1 FOREIGN KEY (assignment_id) REFERENCES flight_assignments (assignment_id) ON DELETE CASCADE,
        CONSTRAINT flight_crew_assignments_ibfk_2 FOREIGN KEY (crew_id) REFERENCES crew_members (crew_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create tables:', error.message);
    process.exit(1);
  }
};

createTables();
