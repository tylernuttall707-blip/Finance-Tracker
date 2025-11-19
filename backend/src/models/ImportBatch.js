import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ImportBatch = sequelize.define('ImportBatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rowCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total number of rows in CSV',
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Number of successfully imported transactions',
  },
  errorCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Number of failed imports',
  },
  status: {
    type: DataTypes.ENUM('processing', 'completed', 'failed'),
    defaultValue: 'processing',
    allowNull: false,
  },
}, {
  tableName: 'import_batches',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
  ],
});

export default ImportBatch;
