import multer from 'multer';
import { parseCSV, getCategorySuggestions, createTransactionsFromImport } from '../services/csvImportService.js';
import { ImportBatch, Transaction, TransactionLine, Account } from '../models/index.js';
import { Op } from 'sequelize';

// Configure multer for CSV file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * Upload and parse CSV file
 * Returns parsed transactions with categorization suggestions
 */
export const uploadCSV = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { bankAccountId } = req.body;
      if (!bankAccountId) {
        return res.status(400).json({ message: 'Bank account ID is required' });
      }

      // Verify bank account exists and belongs to user
      const bankAccount = await Account.findOne({
        where: {
          id: bankAccountId,
          type: 'asset',
        },
      });

      if (!bankAccount) {
        return res.status(404).json({ message: 'Bank account not found' });
      }

      // Parse CSV
      const { transactions, errors, filename } = await parseCSV(
        req.file.buffer,
        req.file.originalname
      );

      // Get categorization suggestions
      const transactionsWithSuggestions = await getCategorySuggestions(
        transactions,
        req.user.id,
        bankAccountId
      );

      // Create import batch record
      const importBatch = await ImportBatch.create({
        userId: req.user.id,
        filename: req.file.originalname,
        rowCount: transactions.length,
        successCount: 0,
        errorCount: errors.length,
        status: 'processing',
      });

      res.json({
        batchId: importBatch.id,
        transactions: transactionsWithSuggestions,
        errors,
        summary: {
          total: transactions.length,
          errors: errors.length,
        },
      });
    } catch (error) {
      console.error('CSV upload error:', error);
      res.status(500).json({
        message: 'Error processing CSV file',
        error: error.message,
      });
    }
  },
];

/**
 * Create transactions from categorized CSV data
 */
export const importTransactions = async (req, res) => {
  try {
    const { batchId, bankAccountId, transactions } = req.body;

    if (!bankAccountId || !transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        message: 'Bank account ID and transactions array are required',
      });
    }

    // Verify bank account
    const bankAccount = await Account.findOne({
      where: {
        id: bankAccountId,
        type: 'asset',
      },
    });

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Filter out transactions that user chose to skip (no accountId)
    const transactionsToImport = transactions.filter(t => t.accountId);

    if (transactionsToImport.length === 0) {
      return res.status(400).json({ message: 'No transactions to import' });
    }

    // Create transactions
    const createdTransactions = await createTransactionsFromImport(
      transactionsToImport,
      bankAccountId,
      req.user.id
    );

    // Update import batch if provided
    if (batchId) {
      await ImportBatch.update(
        {
          successCount: createdTransactions.length,
          errorCount: transactions.length - createdTransactions.length,
          status: 'completed',
        },
        {
          where: { id: batchId },
        }
      );
    }

    res.status(201).json({
      message: 'Transactions imported successfully',
      count: createdTransactions.length,
      transactions: createdTransactions,
    });
  } catch (error) {
    console.error('Import error:', error);

    // Update batch status if provided
    if (req.body.batchId) {
      await ImportBatch.update(
        { status: 'failed' },
        { where: { id: req.body.batchId } }
      );
    }

    res.status(500).json({
      message: 'Error importing transactions',
      error: error.message,
    });
  }
};

/**
 * Get all transactions with filters
 */
export const getTransactions = async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      search,
      limit = 100,
      offset = 0,
    } = req.query;

    const where = {
      userId: req.user.id,
    };

    // Apply filters
    if (type) where.type = type;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { reference: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: TransactionLine,
          as: 'lines',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'name', 'code', 'type'],
            },
          ],
        },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await Transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (req, res) => {
  try {
    const {
      date,
      description,
      reference,
      type,
      status = 'posted',
      debitAccountId,
      creditAccountId,
      amount,
      notes,
    } = req.body;

    // Validate required fields
    if (!date || !description || !debitAccountId || !creditAccountId || !amount) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      date,
      description,
      reference,
      type: type || 'journal',
      status,
      userId: req.user.id,
      notes,
    });

    // Create transaction lines
    await TransactionLine.create({
      transactionId: transaction.id,
      accountId: debitAccountId,
      debit: amount,
      credit: 0,
      description,
    });

    await TransactionLine.create({
      transactionId: transaction.id,
      accountId: creditAccountId,
      debit: 0,
      credit: amount,
      description,
    });

    // Fetch complete transaction with lines
    const completeTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: TransactionLine,
          as: 'lines',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'name', 'code', 'type'],
            },
          ],
        },
      ],
    });

    res.status(201).json(completeTransaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      message: 'Error creating transaction',
      error: error.message,
    });
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      description,
      reference,
      type,
      status,
      notes,
    } = req.body;

    const transaction = await Transaction.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.update({
      date: date || transaction.date,
      description: description || transaction.description,
      reference,
      type: type || transaction.type,
      status: status || transaction.status,
      notes,
    });

    // Fetch updated transaction with lines
    const updatedTransaction = await Transaction.findByPk(id, {
      include: [
        {
          model: TransactionLine,
          as: 'lines',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'name', 'code', 'type'],
            },
          ],
        },
      ],
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      message: 'Error updating transaction',
      error: error.message,
    });
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Delete transaction lines first
    await TransactionLine.destroy({
      where: { transactionId: id },
    });

    // Delete transaction
    await transaction.destroy();

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      message: 'Error deleting transaction',
      error: error.message,
    });
  }
};
