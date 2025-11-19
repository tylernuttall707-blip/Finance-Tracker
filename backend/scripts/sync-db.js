import sequelize from '../src/config/database.js';
import '../src/models/index.js'; // Import models to register them

const syncDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    console.log('Syncing database models...');
    await sequelize.sync({ alter: false });
    console.log('✓ Database models synchronized');

    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();
