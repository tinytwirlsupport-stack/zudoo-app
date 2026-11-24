import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import { incomeRouter, expenseRouter } from './routes/entries.js';
import { notFound, errorHandler } from './middleware/auth.js';

const app = express();

app.use(helmet());
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // allow in development
  },
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ message: 'API is working', status: 'OK' }));
app.get('/api', (req, res) => res.json({ message: 'API is working', status: 'OK' }));
app.get('/api/health', (req, res) => res.json({ ok: true, message: 'API is working' }));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/income', incomeRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
