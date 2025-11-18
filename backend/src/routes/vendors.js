import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Vendor } from '../models/index.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.findAll({ where: { isActive: true } });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vendor' });
  }
});

export default router;
