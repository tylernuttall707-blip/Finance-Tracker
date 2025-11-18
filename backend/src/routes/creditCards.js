import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { CreditCard } from '../models/index.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const cards = await CreditCard.findAll({ where: { isActive: true } });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching credit cards' });
  }
});

router.post('/', async (req, res) => {
  try {
    const card = await CreditCard.create(req.body);
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Error creating credit card' });
  }
});

export default router;
