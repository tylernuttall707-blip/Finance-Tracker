import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CategorizationRule = sequelize.define('CategorizationRule', {
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
  pattern: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Keyword or pattern to match in transaction description',
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'accounts',
      key: 'id',
    },
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 1.0,
    allowNull: false,
    comment: 'Confidence score between 0 and 1',
    validate: {
      min: 0,
      max: 1,
    },
  },
  matchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'Number of times this pattern has been matched',
  },
  lastMatched: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this rule was used',
  },
}, {
  tableName: 'categorization_rules',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['accountId'] },
    { fields: ['pattern'] },
  ],
});

export default CategorizationRule;
