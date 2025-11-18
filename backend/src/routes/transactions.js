import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => res.json([]));
router.post('/', (req, res) => res.status(201).json({ message: 'Coming soon' }));
router.post('/import', (req, res) => res.status(201).json({ message: 'Import coming soon' }));

export default router;
