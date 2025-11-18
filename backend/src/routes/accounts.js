import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Account } from '../models/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { isActive: true },
      order: [['code', 'ASC']],
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});

router.post('/', async (req, res) => {
  try {
    const account = await Account.create(req.body);
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error creating account' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    await account.update(req.body);
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error updating account' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (account.isSystem) {
      return res.status(400).json({ message: 'Cannot delete system account' });
    }
    await account.update({ isActive: false });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' });
  }
});

export default router;
