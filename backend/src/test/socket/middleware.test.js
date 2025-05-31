const http      = require('http');
const Client    = require('socket.io-client');
const { Server } = require('socket.io');
const { socketAuth } = require('../../middlewares/socketIo');
const initInMemoryDb = require('../utils/initDB');
const { makeRoom } = require('../utils/initChatRoom');
const { initUsers } = require('../utils/initUser');

let io, server, port;
let clientSocket;
const username = 'alice';
const roomname = 'testroom';
let room;
beforeAll(async () => {
    server = http.createServer();
    io = new Server(server, {
        transports: ['polling','websocket']
    });
    await initInMemoryDb();
    await initUsers([username]);
    room = await makeRoom(username, roomname);
    socketAuth(io);
    io.on('connection', socket => {
      });
  
    
    await new Promise(resolve => {
        server.listen(() => {
            port = server.address().port;
            resolve();
        });
    });
});

afterAll(async () => {
    // 4) 정리
    if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
    }
    await io.close();
    await new Promise(resolve => server.close(resolve));
});

afterEach(() => {
    if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
    }
});

describe('socket middleware test', () => {
    // 1. username이 없는 경우
    test("connect without username", done => {
        clientSocket = new Client(`http://localhost:${port}`, {
            auth: { username: 'alice' } 
        });
      
        clientSocket.on('connect_error', err => {
            expect(err.message).toBe('username and roomId must be required');
            done();
        });
    });
    // roomId가 없는 경우
    test("connect without roomname", done => {
        clientSocket = new Client(`http://localhost:${port}`, {
            auth: { roomId: room.room_id } 
        });
      
        clientSocket.on('connect_error', err => {
            expect(err.message).toBe('username and roomId must be required');
            done();
        });
    });

    // 해당 방에 사용자가 존재하지 않을 경우
    test("connect not join user", done => {
        const notUser = 'bob';
        clientSocket = new Client(`http://localhost:${port}`, {
            auth: {username: notUser ,roomId: room.room_id }  
        });
      
        clientSocket.on('connect_error', err => {
            expect(err.message).toBe(`user ${notUser} is not in room.`);
            done();
        });
    });

    test("connect join user", done => {
        clientSocket = new Client(`http://localhost:${port}`, {
            auth: {username: username ,roomId: room.room_id },
        });
        clientSocket.on('connect', () => {
            done();
        });
    })
})