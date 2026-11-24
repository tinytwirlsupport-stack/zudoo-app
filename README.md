# Tiny Twirl Finance System - Backend API

Express + MongoDB backend for The Tiny Twirl Kids Gymnastics Finance Application.

## Environment Variables
Set the following environment variables in your deployment (e.g., Render):
- `PORT` (e.g., 5000)
- `MONGO_URI` (MongoDB Atlas connection string)
- `JWT_SECRET` (A strong random secret string)
- `CLIENT_URL` (Frontend URL, e.g., https://your-frontend.vercel.app)
- `ADMIN_NAME` (Admin)
- `ADMIN_EMAIL` (admin email)
- `ADMIN_PASSWORD` (admin password)

## Commands
- `npm start` - Starts production server
- `npm run dev` - Starts development server with nodemon
- `npm run seed:admin` - Seeds/resets the admin user
