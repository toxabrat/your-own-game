import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*"
};

