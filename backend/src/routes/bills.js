import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Bill, Vendor } from '../models/index.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const bills = await Bill.findAll({ include: [{ model: Vendor, as: 'vendor' }] });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bills' });
  }
});

router.post('/', async (req, res) => {
  try {
    const bill = await Bill.create(req.body);
    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Error creating bill' });
  }
});

export default router;
