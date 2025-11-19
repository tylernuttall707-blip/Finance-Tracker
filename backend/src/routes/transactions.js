import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadCSV,
  importTransactions,
} from '../controllers/transactionController.js';

const router = express.Router();
router.use(authenticate);

// Transaction CRUD
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

// CSV Import
router.post('/upload-csv', uploadCSV);
router.post('/import', importTransactions);

export default router;
