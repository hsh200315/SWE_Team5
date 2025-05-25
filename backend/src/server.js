
const http = require('http');
const { PORT } = require('./helpers/env');
const app = require('./app');
require('dotenv').config();

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(
      `Server running running at port ${PORT}`
    );
});