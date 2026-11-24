import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    date: { type: Date, required: true, index: true },
    addedBy: { type: String, required: true, trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

export default mongoose.model('Income', incomeSchema);
