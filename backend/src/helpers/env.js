require('dotenv').config();
const path   = require('path');

module.exports = {
    // app
    APP_NAME: 'Sena',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 4000,
    APP_CLIENT: process.env.APP_CLIENT,
    // database
    DB_PATH: path.join(__dirname, '..', process.env.DB_PATH),
    API_VERSION: process.env.API_VERSION || 'v1',
    API_URL: '/api/'+this.API_VERSION
};