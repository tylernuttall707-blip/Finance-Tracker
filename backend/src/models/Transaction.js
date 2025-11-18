import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  reference: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Check number, invoice number, etc.',
  },
  type: {
    type: DataTypes.ENUM('journal', 'bank', 'credit_card', 'invoice', 'bill', 'payment'),
    defaultValue: 'journal',
  },
  status: {
    type: DataTypes.ENUM('draft', 'posted', 'void'),
    defaultValue: 'posted',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    { fields: ['date'] },
    { fields: ['type'] },
    { fields: ['status'] },
  ],
});

export default Transaction;
