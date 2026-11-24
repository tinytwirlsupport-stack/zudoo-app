import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Brute-force protection: 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', protect, (req, res) => res.json({ message: 'Logged out' }));

router.get('/me', protect, (req, res) =>
  res.json({ admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email } })
);

export default router;
