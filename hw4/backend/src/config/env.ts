import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  databasePath: process.env.DATABASE_PATH || './database.sqlite',
  nodeEnv: process.env.NODE_ENV || 'development'
};
