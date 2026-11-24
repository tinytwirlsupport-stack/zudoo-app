import { Router } from 'express';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD   (or ?month=&year=, or ?year=, or nothing = all dates)
// Returns every income & expense entry in range plus month-wise and year-wise summaries.
// PDF / Excel / Print are generated in the browser from this JSON.
router.get('/', async (req, res, next) => {
  try {
    let from, to;
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);

    if (req.query.from || req.query.to) {
      from = req.query.from ? new Date(req.query.from) : undefined;
      if (req.query.to) {
        to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
      }
    } else if (year && month) {
      from = new Date(year, month - 1, 1);
      to = new Date(year, month, 1);
      to.setMilliseconds(-1);
    } else if (year) {
      from = new Date(year, 0, 1);
      to = new Date(year + 1, 0, 1);
      to.setMilliseconds(-1);
    }

    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const [income, expenses] = await Promise.all([
      Income.find(filter).sort({ date: 1 }),
      Expense.find(filter).sort({ date: 1 }),
    ]);

    const totalIncome = income.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // month-wise summary (key: YYYY-MM)
    const byMonth = {};
    const bump = (list, field) =>
      list.forEach((e) => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth[key] ??= { period: key, income: 0, expenses: 0 };
        byMonth[key][field] += e.amount;
      });
    bump(income, 'income');
    bump(expenses, 'expenses');

    const monthSummary = Object.values(byMonth)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((m) => ({ ...m, netProfit: m.income - m.expenses }));

    const byYear = {};
    monthSummary.forEach((m) => {
      const y = m.period.slice(0, 4);
      byYear[y] ??= { period: y, income: 0, expenses: 0 };
      byYear[y].income += m.income;
      byYear[y].expenses += m.expenses;
    });
    const yearSummary = Object.values(byYear).map((y) => ({ ...y, netProfit: y.income - y.expenses }));

    res.json({
      generatedAt: new Date(),
      range: { from: from || null, to: to || null },
      totals: { income: totalIncome, expenses: totalExpenses, netProfit: totalIncome - totalExpenses },
      income,
      expenses,
      monthSummary,
      yearSummary,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
