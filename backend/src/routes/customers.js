import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Customer } from '../models/index.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({ where: { isActive: true } });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

router.post('/', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error creating customer' });
  }
});

export default router;
