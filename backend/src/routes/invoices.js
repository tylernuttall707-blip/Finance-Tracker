import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Invoice, Customer } from '../models/index.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.findAll({ include: [{ model: Customer, as: 'customer' }] });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

router.post('/', async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

export default router;
