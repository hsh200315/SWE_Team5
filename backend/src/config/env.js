require('dotenv').config({
    path: `.env.${process.env.NODE_ENV || 'development'}`
  });
  
const path   = require('path');
const rawPath = process.env.DB_PATH;

const DB_PATH = rawPath === ':memory:'
  ? ':memory:'
  : path.join(__dirname, '..', rawPath);



module.exports = {
    // app
    APP_NAME: 'Sena',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 4000,
    APP_CLIENT: process.env.APP_CLIENT,
    // database
    DB_PATH: DB_PATH,
    API_VERSION: process.env.API_VERSION || 'v1',
    OPENAI_API_KEY: process.env.OPENAI_API,
    SECRET_KEY: process.env.SECRET_KEY,
    // api key
    BRAVE_API_KEY: process.env.BRAVE_API,
    GOOGLE_API_KEY: process.env.GOOGLE_API,
    RAPID_API_KEY: process.env.RAPID_API,
    AMADEUS_API_KEY: process.env.AMADEUS_API,
    AMADEUS_SECRET: process.env.AMADEUS_SECRET, 
};