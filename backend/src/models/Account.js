import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
    allowNull: false,
  },
  subtype: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., current_asset, fixed_asset, accounts_receivable, accounts_payable, etc.',
  },
  normalBalance: {
    type: DataTypes.ENUM('debit', 'credit'),
    allowNull: false,
    comment: 'Assets & Expenses = debit, Liabilities & Equity & Revenue = credit',
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'accounts',
      key: 'id',
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System accounts cannot be deleted',
  },
}, {
  tableName: 'accounts',
  timestamps: true,
});

// Self-referential association for parent-child hierarchy
Account.hasMany(Account, { as: 'children', foreignKey: 'parentId' });
Account.belongsTo(Account, { as: 'parent', foreignKey: 'parentId' });

export default Account;
