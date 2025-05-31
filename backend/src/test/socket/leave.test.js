const http      = require('http');
const Client    = require('socket.io-client');
const { Server } = require('socket.io');
const { socketAuth } = require('../../middlewares/socketIo');
const initInMemoryDb = require('../utils/initDB');
const { makeRoom,getUserlist, inviteUsers } = require('../utils/initChatRoom');
const { initUsers } = require('../utils/initUser');
const listenSocket = require("../../sockets");
// 테스트에 필요한 전역변수들
let io, server, port;
let inviterSocket, leaverSocket;
const inviter = 'alice';
const leaver = 'bob';
const notInviter = 'charil'
const roomname = 'testroom';
let room;
// 1. setup
beforeAll(async () => {
    server = http.createServer();
    io = new Server(server, {
        transports: ['polling','websocket']
    });
    // 초기 설정
    await initInMemoryDb();
    await initUsers([inviter, leaver,notInviter]);
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

describe('socket invite test', () => {
    // 1. 정상적으로 떠나는 경우.
    test("leave unexisted user", done => {
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