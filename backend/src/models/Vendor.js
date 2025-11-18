import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tax ID / EIN',
  },
  paymentTerms: {
    type: DataTypes.STRING(50),
    defaultValue: 'Net 30',
  },
  accountNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Account number with this vendor',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'vendors',
  timestamps: true,
});

export default Vendor;
