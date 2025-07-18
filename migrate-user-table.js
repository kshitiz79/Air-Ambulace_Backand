// Migration script to add missing columns to users table
const sequelize = require('./src/config/database');

async function migrateUserTable() {
  console.log('🔄 Migrating users table...\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Add missing columns to users table
    console.log('Adding missing columns to users table...');

    // Add address column
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN address TEXT NULL
      `);
      console.log('✅ Added address column');
    } catch (error) {
      if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ address column already exists');
      } else {
        console.error('❌ Error adding address column:', error.message);
      }
    }

    // Add profile_picture column
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN profile_picture VARCHAR(255) NULL
      `);
      console.log('✅ Added profile_picture column');
    } catch (error) {
      if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ profile_picture column already exists');
      } else {
        console.error('❌ Error adding profile_picture column:', error.message);
      }
    }

    // Add status column
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
      `);
      console.log('✅ Added status column');
    } catch (error) {
      if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ status column already exists');
      } else {
        console.error('❌ Error adding status column:', error.message);
      }
    }

    // Verify the table structure
    console.log('\n📋 Verifying table structure...');
    const [results] = await sequelize.query('DESCRIBE users');
    console.log('Current users table columns:');
    results.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(nullable)' : '(not null)'} ${column.Default ? `default: ${column.Default}` : ''}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
migrateUserTable();