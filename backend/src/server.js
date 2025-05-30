
const http = require('http');
const { PORT } = require('./helpers/env');
const app = require('./app');
const { initializeDB } = require('./config/db');
require('dotenv').config();


async function initializeAndStartServer() {
  await initializeDB();
  const server = http.createServer(app);

  server.listen(PORT, () => {
      console.log(
        `Server running running at port ${PORT}`
      );
  });
}

initializeAndStartServer();