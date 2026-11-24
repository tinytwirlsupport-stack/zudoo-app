import { Router } from 'express';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds a generic CRUD router for Income or Expense.
// searchFields: text fields searched by ?search=
// allowed: fields the client may write (blocks mass-assignment)
const buildRouter = (Model, searchFields, allowed) => {
  const router = Router();
  router.use(protect);

  const pick = (body) => Object.fromEntries(allowed.map((k) => [k, body[k]]));

  router.get('/', async (req, res, next) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const filter = {};

      if (req.query.search) {
        const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      if (req.query.from || req.query.to) {
        filter.date = {};
        if (req.query.from) filter.date.$gte = new Date(req.query.from);
        if (req.query.to) {
          const to = new Date(req.query.to);
          to.setHours(23, 59, 59, 999);
          filter.date.$lte = to;
        }
      }

      const [items, total, sum] = await Promise.all([
        Model.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Model.countDocuments(filter),
        Model.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      ]);

      res.json({
        items,
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        filteredTotal: sum[0]?.total || 0,
      });
    } catch (e) {
      next(e);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await Model.create(pick(req.body)));
    } catch (e) {
      next(e);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, pick(req.body), {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ message: 'Entry not found' });
      res.json(doc);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Entry not found' });
      res.json({ message: 'Deleted' });
    } catch (e) {
      next(e);
    }
  });

  return router;
};

export const incomeRouter = buildRouter(Income, ['description', 'addedBy'], [
  'amount',
  'description',
  'date',
  'addedBy',
]);

export const expenseRouter = buildRouter(Expense, ['expenseName', 'expenserName'], [
  'expenseName',
  'amount',
  'date',
  'expenserName',
]);
