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
let inviterSocket, inviteeSocket ;
const inviter = 'alice';
const invitee = 'bob';
const roomname = 'testroom';
let room;
// 1. setup
beforeAll(async () => {
    server = http.createServer();
    io = new Server(server, {
        transports: ['polling','websocket']
    });
    await initInMemoryDb();
    await initUsers([inviter, invitee]);
    room = await makeRoom(inviter,roomname);
   
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
    if (inviteeSocket && inviteeSocket.connected) {
        inviteeSocket.disconnect();
    }
    await io.close();
    await new Promise(resolve => server.close(resolve));
});

afterEach(() => {
    if (inviterSocket && inviterSocket.connected) {
        inviterSocket.disconnect();
    }
    if (inviteeSocket && inviteeSocket.connected) {
        inviteeSocket.disconnect();
    }
});
// 2. 존재하지 않는 User 초대

describe('socket invite test', () => {
    // 1. inviteUsername이 비어있는 경우
    test("invite without inviteeusername", done => {
        inviterSocket = new Client(`http://localhost:${port}`, {
            auth: { username: inviter, roomId: room.room_id }
        });
        inviterSocket.on('connect', () => {
            inviterSocket.emit('invite', {});
        });
        inviterSocket.on('invite-error', (data) => {
            expect(data.message).toBe(`userlist is empty.`);
            done();
        })
    });
    // 2. 존재하지 않는 user를 초대하는 경우
    test("invite not existed inviteeusername", done => {
        const unExistedUsername = 'charil';
        inviterSocket = new Client(`http://localhost:${port}`, {
            auth: { username: inviter, roomId: room.room_id }
        });

        inviterSocket.on('connect', () => {
            inviterSocket.emit('invite', {userlist: [unExistedUsername]});
        });
        inviterSocket.on('invite', (data) => {
            expect(data.successUserlist).toStrictEqual([]);
            expect(data.failUserlist).toStrictEqual([unExistedUsername]);
            done();
        })
    });
    // 3. 이미 채팅방에 존재하는 user를 초대하는 경우
    test("invite already joined inviteeusername", done => {
        const alreadyJoinUsername = inviter;
        inviterSocket = new Client(`http://localhost:${port}`, {
            auth: { username: inviter, roomId: room.room_id }
        });
        inviterSocket.on('connect', () => {
            inviterSocket.emit('invite', {userlist: [alreadyJoinUsername]});
        });
        inviterSocket.on('invite', (data) => {
            expect(data.successUserlist).toStrictEqual([]);
            expect(data.failUserlist).toStrictEqual([alreadyJoinUsername]);
            done();
        });
    });
    // 4. user를 정상적으로 초대하는 경우
    test("invite  inviteeusername", done => {
        const username = invitee;
        inviterSocket = new Client(`http://localhost:${port}`, {
            auth: { username: inviter, roomId: room.room_id }
        });
        inviterSocket.on('connect', () => {
            inviterSocket.emit('invite', {userlist: [username]});
        });
        
        inviterSocket.on('invite', async (data) => {
            expect(data.successUserlist).toStrictEqual([username]);
            const userlist = await getUserlist(room.room_id);
            expect(userlist.length).toBe(2);
            done();
        });
    });
});