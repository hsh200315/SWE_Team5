const http = require('http');
const { PORT } = require('./config/env');
const app = require('./app');
const { initializeDB } = require('./config/db');
const socketio = require('socket.io');
const listenSocket = require("./sockets");
const { socketAuth } = require('./middlewares/socketIo');
require('dotenv').config();


async function initializeAndStartServer() {
  await initializeDB();
  const server = http.createServer(app);
  const io = socketio(server,{
    cors: {
      origin: '*',
    },
  });
  socketAuth(io);
  io.on('connection', (socket) => {
    listenSocket(io, socket);
  });
  server.listen(PORT, () => {
      console.log(
        `Server running running at port ${PORT}`
      );
  });
}

initializeAndStartServer();