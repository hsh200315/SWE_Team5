const http      = require('http');
const Client    = require('socket.io-client');
const { Server } = require('socket.io');
const { socketAuth } = require('../../middlewares/socketIo');
const initInMemoryDb = require('../utils/initDB');
const { makeRoom,getUserlist, inviteUsers } = require('../utils/initChatRoom');
const { initUsers } = require('../utils/initUser');
const listenSocket = require("../../sockets");
let io, server, port;
let inviterSocket, leaverSocket;
const inviter = 'alice';
const leaver = 'bob';
const roomname = 'testroom';
let room;
// 1. setup
beforeAll(async () => {
    server = http.createServer();
    io = new Server(server, {
        transports: ['polling','websocket']
    });
    await initInMemoryDb();
    await initUsers([inviter, leaver]);
    // inviter가 방을 만든다.
    room = await makeRoom(inviter, roomname);
    await inviteUsers(room.room_id, [leaver]);
    socketAuth(io);
    io.on('connection', (socket) => {
        listenSocket(io, socket);
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
    if (inviterSocket && inviterSocket.connected) {
        inviterSocket.disconnect();
    }
    if (leaverSocket && leaverSocket.connected) {
        leaverSocket.disconnect();
    }
    await io.close();
    await new Promise(resolve => server.close(resolve));
});

afterEach(() => {
    if (inviterSocket && inviterSocket.connected) {
        inviterSocket.disconnect();
    }
    if (leaverSocket && leaverSocket.connected) {
        leaverSocket.disconnect();
    }
});
// 2. 존재하지 않는 User 초대

describe('socket invite test', () => {
    // 1. 정상적으로 떠나는 경우
    test("leave user", done => {
        inviterSocket = new Client(`http://localhost:${port}`, {
            auth: { username: inviter, roomId: room.room_id }
        });
        leaverSocket = new Client(`http://localhost:${port}`, {
            auth: { username: leaver, roomId: room.room_id }
        });
        inviterSocket.on('connect', () => {});
        leaverSocket.on('connect', () => {
            leaverSocket.emit("leave");
        });
        inviterSocket.on('leave', async (data) => {
            expect(data.username).toBe(leaver);
            const userlist = await getUserlist(room.room_id);
            expect(userlist.length).toBe(1);
            
            done();
        });
    });
});