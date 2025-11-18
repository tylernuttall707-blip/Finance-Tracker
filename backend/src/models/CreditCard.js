import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CreditCard = sequelize.define('CreditCard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Card name/nickname',
  },
  issuer: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Chase, AmEx, Visa, etc.',
  },
  lastFour: {
    type: DataTypes.STRING(4),
    allowNull: true,
  },
  creditLimit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  currentBalance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  availableCredit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  apr: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    comment: 'Annual Percentage Rate',
  },
  dueDay: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 31,
    },
    comment: 'Day of month payment is due',
  },
  statementDay: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 31,
    },
    comment: 'Day of month statement closes',
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'accounts',
      key: 'id',
    },
    comment: 'Linked liability account in chart of accounts',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'credit_cards',
  timestamps: true,
});

export default CreditCard;
