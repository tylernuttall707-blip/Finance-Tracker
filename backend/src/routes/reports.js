import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/profit-loss', (req, res) => {
  res.json({ message: 'P&L report coming soon', data: null });
});

router.get('/balance-sheet', (req, res) => {
  res.json({ message: 'Balance sheet coming soon', data: null });
});

router.get('/cash-flow', (req, res) => {
  res.json({ message: 'Cash flow statement coming soon', data: null });
});

router.get('/cash-flow-forecast', (req, res) => {
  res.json({ message: 'Cash flow forecast coming soon', data: [] });
});

export default router;
