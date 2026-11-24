import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseName: { type: String, required: true, trim: true, maxlength: 150 },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    date: { type: Date, required: true, index: true },
    expenserName: { type: String, required: true, trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
