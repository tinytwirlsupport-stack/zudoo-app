import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Protects every route: only a valid admin token gets through.
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authorised. Please log in.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: 'Admin account not found.' });

    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

export const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

export const errorHandler = (err, req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
