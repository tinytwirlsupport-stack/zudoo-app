import { Router } from 'express';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const sumBetween = async (Model, from, to) => {
  const match = from ? { date: { $gte: from, $lt: to } } : {};
  const r = await Model.aggregate([{ $match: match }, { $group: { _id: null, t: { $sum: '$amount' } } }]);
  return r[0]?.t || 0;
};

const monthly = async (Model, year) => {
  const rows = await Model.aggregate([
    { $match: { date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } } },
    { $group: { _id: { $month: '$date' }, t: { $sum: '$amount' } } },
  ]);
  const out = Array(12).fill(0);
  rows.forEach((r) => (out[r._id - 1] = r.t));
  return out;
};

// GET /api/dashboard?month=1-12&year=2026
// Everything is aggregated live from the database, so the numbers can never drift
// out of sync when entries are added, edited or deleted.
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    const mFrom = new Date(year, month - 1, 1);
    const mTo = new Date(year, month, 1);
    const yFrom = new Date(year, 0, 1);
    const yTo = new Date(year + 1, 0, 1);

    const [totalIncome, totalExpense, mInc, mExp, yInc, yExp, incByMonth, expByMonth, latestIncome, latestExpenses] =
      await Promise.all([
        sumBetween(Income),
        sumBetween(Expense),
        sumBetween(Income, mFrom, mTo),
        sumBetween(Expense, mFrom, mTo),
        sumBetween(Income, yFrom, yTo),
        sumBetween(Expense, yFrom, yTo),
        monthly(Income, year),
        monthly(Expense, year),
        Income.find().sort({ date: -1, createdAt: -1 }).limit(5),
        Expense.find().sort({ date: -1, createdAt: -1 }).limit(5),
      ]);

    res.json({
      month,
      year,
      allTime: { income: totalIncome, expenses: totalExpense, netProfit: totalIncome - totalExpense },
      selectedMonth: { income: mInc, expenses: mExp, netProfit: mInc - mExp },
      selectedYear: { income: yInc, expenses: yExp, netProfit: yInc - yExp },
      chart: {
        income: incByMonth,
        expenses: expByMonth,
        netProfit: incByMonth.map((v, i) => v - expByMonth[i]),
      },
      latestIncome,
      latestExpenses,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
