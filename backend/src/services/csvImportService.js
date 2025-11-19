import csv from 'csv-parser';
import { Readable } from 'stream';
import { Transaction, TransactionLine, CategorizationRule, Account, ImportBatch } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Parse CSV file buffer into array of transactions
 * Supports flexible CSV formats with headers
 */
export async function parseCSV(fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let lineNumber = 1;

    Readable.from(fileBuffer.toString())
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        skipLines: 0,
      }))
      .on('data', (data) => {
        lineNumber++;
        try {
          // Flexible column mapping - support various CSV formats
          const transaction = parseTransactionRow(data, lineNumber);
          if (transaction) {
            results.push(transaction);
          }
        } catch (error) {
          errors.push({
            line: lineNumber,
            error: error.message,
            data,
          });
        }
      })
      .on('end', () => {
        resolve({ transactions: results, errors, filename });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Parse a single CSV row into transaction format
 * Supports multiple date and amount column names
 */
function parseTransactionRow(row, lineNumber) {
  // Find date column (flexible naming)
  const dateFields = ['date', 'transaction_date', 'trans_date', 'posting_date', 'post_date'];
  const date = findFieldValue(row, dateFields);

  // Find description column
  const descFields = ['description', 'desc', 'memo', 'transaction_description', 'payee', 'name'];
  const description = findFieldValue(row, descFields);

  // Find amount column - handle both single amount and debit/credit columns
  let amount = 0;
  const amountFields = ['amount', 'transaction_amount', 'trans_amount'];
  const debitFields = ['debit', 'withdrawal', 'withdrawals', 'debit_amount'];
  const creditFields = ['credit', 'deposit', 'deposits', 'credit_amount'];

  // Check for single amount column
  const amountValue = findFieldValue(row, amountFields);
  if (amountValue) {
    amount = parseAmount(amountValue);
  } else {
    // Check for separate debit/credit columns
    const debitValue = findFieldValue(row, debitFields);
    const creditValue = findFieldValue(row, creditFields);

    if (debitValue) {
      amount = -Math.abs(parseAmount(debitValue));
    } else if (creditValue) {
      amount = Math.abs(parseAmount(creditValue));
    }
  }

  // Find reference/check number
  const refFields = ['reference', 'ref', 'check_number', 'check_num', 'transaction_id', 'trans_id'];
  const reference = findFieldValue(row, refFields) || '';

  if (!date || !description) {
    throw new Error(`Missing required fields (date or description) on line ${lineNumber}`);
  }

  return {
    date: parseDate(date),
    description: description.trim(),
    amount,
    reference: reference.trim(),
    lineNumber,
    rawData: row,
  };
}

/**
 * Find first matching field value from list of possible field names
 */
function findFieldValue(row, fieldNames) {
  for (const field of fieldNames) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      return row[field];
    }
  }
  return null;
}

/**
 * Parse amount string to number
 * Handles various formats: $1,234.56, (1234.56), -1234.56
 */
function parseAmount(amountStr) {
  if (typeof amountStr === 'number') return amountStr;

  let str = amountStr.toString().trim();

  // Handle parentheses as negative
  const isNegative = str.startsWith('(') && str.endsWith(')');
  if (isNegative) {
    str = str.slice(1, -1);
  }

  // Remove currency symbols and commas
  str = str.replace(/[$,]/g, '');

  const amount = parseFloat(str);
  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  return isNegative ? -amount : amount;
}

/**
 * Parse date string to YYYY-MM-DD format
 * Supports various date formats
 */
function parseDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get smart categorization suggestions for transactions
 * Uses historical data and learned patterns
 */
export async function getCategorySuggestions(transactions, userId, bankAccountId) {
  const suggestions = [];

  for (const transaction of transactions) {
    const suggestion = await getSuggestionForTransaction(
      transaction.description,
      transaction.amount,
      userId,
      bankAccountId
    );

    suggestions.push({
      ...transaction,
      suggestedAccountId: suggestion.accountId,
      suggestedAccountName: suggestion.accountName,
      confidence: suggestion.confidence,
      reason: suggestion.reason,
    });
  }

  return suggestions;
}

/**
 * Get suggestion for a single transaction
 */
async function getSuggestionForTransaction(description, amount, userId, bankAccountId) {
  const descLower = description.toLowerCase();

  // Strategy 1: Check for exact or partial pattern matches in categorization rules
  const rules = await CategorizationRule.findAll({
    where: {
      userId,
      pattern: {
        [Op.or]: [
          { [Op.eq]: descLower }, // Exact match
          { [Op.substring]: descLower }, // Pattern is substring of description
        ],
      },
    },
    include: [
      {
        model: Account,
        as: 'account',
        attributes: ['id', 'name', 'code'],
      },
    ],
    order: [
      ['confidence', 'DESC'],
      ['matchCount', 'DESC'],
    ],
    limit: 1,
  });

  if (rules.length > 0) {
    const rule = rules[0];
    return {
      accountId: rule.accountId,
      accountName: rule.account.name,
      confidence: parseFloat(rule.confidence),
      reason: `Based on ${rule.matchCount} similar transaction${rule.matchCount > 1 ? 's' : ''}`,
    };
  }

  // Strategy 2: Look for similar historical transactions
  const historicalMatch = await findHistoricalMatch(description, userId);
  if (historicalMatch) {
    return historicalMatch;
  }

  // Strategy 3: Default suggestion based on transaction type (income vs expense)
  const defaultAccount = await getDefaultAccount(amount, userId);
  return {
    accountId: defaultAccount?.id || null,
    accountName: defaultAccount?.name || 'Unknown',
    confidence: 0.3,
    reason: 'Default suggestion based on transaction type',
  };
}

/**
 * Find similar historical transactions
 */
async function findHistoricalMatch(description, userId) {
  const descLower = description.toLowerCase();
  const keywords = descLower.split(/\s+/).filter(word => word.length > 3);

  if (keywords.length === 0) return null;

  // Find transactions with similar descriptions
  const historicalTransactions = await Transaction.findAll({
    where: {
      userId,
      description: {
        [Op.iLike]: `%${keywords[0]}%`,
      },
    },
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
    limit: 10,
  });

  if (historicalTransactions.length === 0) return null;

  // Find most common account used (excluding bank accounts)
  const accountFrequency = {};
  for (const trans of historicalTransactions) {
    for (const line of trans.lines) {
      if (line.account && line.account.type !== 'asset') {
        const key = line.account.id;
        accountFrequency[key] = (accountFrequency[key] || 0) + 1;
      }
    }
  }

  const entries = Object.entries(accountFrequency);
  if (entries.length === 0) return null;

  // Sort by frequency
  entries.sort((a, b) => b[1] - a[1]);
  const [mostCommonAccountId, frequency] = entries[0];

  // Find the account details
  const account = await Account.findByPk(mostCommonAccountId);
  if (!account) return null;

  const confidence = Math.min(0.9, 0.5 + (frequency / historicalTransactions.length) * 0.4);

  return {
    accountId: account.id,
    accountName: account.name,
    confidence,
    reason: `Found ${frequency} similar transaction${frequency > 1 ? 's' : ''}`,
  };
}

/**
 * Get default account based on transaction type (income vs expense)
 */
async function getDefaultAccount(amount, userId) {
  const accountType = amount > 0 ? 'revenue' : 'expense';

  const account = await Account.findOne({
    where: {
      type: accountType,
      isActive: true,
    },
    order: [['code', 'ASC']],
  });

  return account;
}

/**
 * Learn from user's categorization choice
 * Updates or creates categorization rules
 */
export async function learnFromCategorization(description, accountId, userId) {
  const pattern = description.toLowerCase().trim();

  // Check if rule already exists
  const existingRule = await CategorizationRule.findOne({
    where: {
      userId,
      pattern,
      accountId,
    },
  });

  if (existingRule) {
    // Update existing rule - increase match count and confidence
    const newMatchCount = existingRule.matchCount + 1;
    const newConfidence = Math.min(1.0, existingRule.confidence + 0.05);

    await existingRule.update({
      matchCount: newMatchCount,
      confidence: newConfidence,
      lastMatched: new Date(),
    });
  } else {
    // Create new rule
    await CategorizationRule.create({
      userId,
      pattern,
      accountId,
      confidence: 0.7,
      matchCount: 1,
      lastMatched: new Date(),
    });
  }
}

/**
 * Create transactions from categorized imports
 * Follows GAAP double-entry bookkeeping
 */
export async function createTransactionsFromImport(categorizedTransactions, bankAccountId, userId) {
  const t = await sequelize.transaction();

  try {
    const createdTransactions = [];

    for (const item of categorizedTransactions) {
      const { date, description, amount, reference, accountId } = item;

      if (!accountId) {
        throw new Error(`No account selected for transaction: ${description}`);
      }

      // Create transaction
      const transaction = await Transaction.create({
        date,
        description,
        reference: reference || null,
        type: 'bank',
        status: 'posted',
        userId,
      }, { transaction: t });

      // Create transaction lines following GAAP
      // For bank transactions:
      // - If amount is negative (expense): Debit expense account, Credit bank account
      // - If amount is positive (income): Debit bank account, Credit revenue account

      const absAmount = Math.abs(amount);

      if (amount < 0) {
        // Expense transaction
        // Debit: Expense Account (increase expense)
        await TransactionLine.create({
          transactionId: transaction.id,
          accountId: accountId,
          debit: absAmount,
          credit: 0,
          description,
        }, { transaction: t });

        // Credit: Bank Account (decrease asset)
        await TransactionLine.create({
          transactionId: transaction.id,
          accountId: bankAccountId,
          debit: 0,
          credit: absAmount,
          description,
        }, { transaction: t });
      } else {
        // Income transaction
        // Debit: Bank Account (increase asset)
        await TransactionLine.create({
          transactionId: transaction.id,
          accountId: bankAccountId,
          debit: absAmount,
          credit: 0,
          description,
        }, { transaction: t });

        // Credit: Revenue Account (increase revenue)
        await TransactionLine.create({
          transactionId: transaction.id,
          accountId: accountId,
          debit: 0,
          credit: absAmount,
          description,
        }, { transaction: t });
      }

      createdTransactions.push(transaction);

      // Learn from this categorization
      await learnFromCategorization(description, accountId, userId);
    }

    await t.commit();
    return createdTransactions;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}
