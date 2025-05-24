const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { APP_NAME, PORT } = require('./helpers/env');
const { failed } = require('./config/response');

require('dotenv').config();

const app = express();

// morgan
app.use(morgan('dev'));

// enable cors
app.use(cors());

app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const server = http.createServer(app);

app.get('/',(req,res) => {
    res.send("Sena");
})


app.use((req, res) => {
    failed(res, {
      code: 404,
      message: 'Resource on that url not found',
      error: 'Not Found',
    });
  });

server.listen(PORT, () => {
    console.log(
      `Server running running at port ${PORT}`
    );
});
  