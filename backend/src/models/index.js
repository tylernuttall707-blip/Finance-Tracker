import User from './User.js';
import Account from './Account.js';
import Transaction from './Transaction.js';
import TransactionLine from './TransactionLine.js';
import Category from './Category.js';
import Vendor from './Vendor.js';
import Customer from './Customer.js';
import Bill from './Bill.js';
import Invoice from './Invoice.js';
import CreditCard from './CreditCard.js';

// User associations
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Transaction associations
Transaction.hasMany(TransactionLine, { foreignKey: 'transactionId', as: 'lines' });
TransactionLine.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// Account associations
Account.hasMany(TransactionLine, { foreignKey: 'accountId', as: 'lines' });
TransactionLine.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

Account.hasMany(CreditCard, { foreignKey: 'accountId', as: 'creditCards' });
CreditCard.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Category associations
Category.hasMany(TransactionLine, { foreignKey: 'categoryId', as: 'lines' });
TransactionLine.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Vendor associations
Vendor.hasMany(Bill, { foreignKey: 'vendorId', as: 'bills' });
Bill.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });

// Customer associations
Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Bill/Invoice to Transaction associations
Bill.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
Transaction.hasOne(Bill, { foreignKey: 'transactionId', as: 'bill' });

Invoice.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
Transaction.hasOne(Invoice, { foreignKey: 'transactionId', as: 'invoice' });

export {
  User,
  Account,
  Transaction,
  TransactionLine,
  Category,
  Vendor,
  Customer,
  Bill,
  Invoice,
  CreditCard,
};
