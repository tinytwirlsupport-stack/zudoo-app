import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';

// Creates (or updates the password of) the single admin account from .env
const run = async () => {
  const { MONGO_URI, ADMIN_NAME = 'Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    { name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), password: hash },
    { upsert: true, new: true }
  );
  console.log(`Admin ready: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
};
run();
