const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const { APP_NAME, API_VERSION } = require('./helpers/env');
const { failed } = require('./config/response');

require('dotenv').config();

const app = express();

// morgan
app.use(morgan('dev'));

// enable cors
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(req,res) => {
    res.send(APP_NAME);
});

const API_URL = `/api/${API_VERSION}`;

app.use(API_URL, require('./routes/auth.route'));
app.use(API_URL, require('./routes/chatrooms.route'));



app.use((req, res) => {
    failed(res, {
      code: 404,
      message: 'Resource on that url not found',
      error: 'Not Found',
    });
});

module.exports = app;
