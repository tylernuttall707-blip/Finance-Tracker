import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json({
    totalCash: '$0.00',
    accountsReceivable: '$0.00',
    accountsPayable: '$0.00',
    creditCardBalance: '$0.00',
  });
});

export default router;
