import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TransactionLine = sequelize.define('TransactionLine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'transactions',
      key: 'id',
    },
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'accounts',
      key: 'id',
    },
  },
  debit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
    },
  },
  credit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
  },
}, {
  tableName: 'transaction_lines',
  timestamps: true,
  validate: {
    debitOrCredit() {
      if ((this.debit === 0 || this.debit === null) &&
          (this.credit === 0 || this.credit === null)) {
        throw new Error('Either debit or credit must be non-zero');
      }
      if (this.debit > 0 && this.credit > 0) {
        throw new Error('Cannot have both debit and credit on same line');
      }
    },
  },
});

export default TransactionLine;
