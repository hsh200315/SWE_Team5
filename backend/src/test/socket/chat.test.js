// alice가 bob에게 메시지를 보내고
// chatMsg를 정상적으로 수신하는지 확인한다.
// 또한 다른 방에 있는 참여자에게는 메시지가 가지 않는지 확인한다.
const http      = require('http');
const Client    = require('socket.io-client');
const { Server } = require('socket.io');
const { socketAuth } = require('../../middlewares/socketIo');
const initInMemoryDb = require('../utils/initDB');
const { makeRoom,getUserlist, inviteUsers } = require('../utils/initChatRoom');
const { initUsers } = require('../utils/initUser');
const listenSocket = require("../../sockets");
let io, server, port;
let senderSocket, receiverSocket, notReceiverSocket;
const sender = 'alice';
const receiver = 'bob';
const notReceiver = 'charil';
const roomname = 'testroom';
let room, notreceiveRoom;
// 1. setup
beforeAll(async () => {
    server = http.createServer();
    io = new Server(server, {
        transports: ['polling','websocket']
    });
    await initInMemoryDb();
    await initUsers([sender, receiver, notReceiver]);
    // sender가 방을 만든다.
    room = await makeRoom(sender, roomname);
    await inviteUsers(room.room_id, [receiver]);
    // 방을 하나 더 만들어서 다른 방에는 메시지가 가지 않는지 확인한다.
    notreceiveRoom = await makeRoom(notReceiver, "notreceiveRoom");
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
    if (senderSocket && senderSocket.connected) {
        senderSocket.disconnect();
    }
    if (receiverSocket && receiverSocket.connected) {
        receiverSocket.disconnect();
    }
    if(notReceiverSocket && notReceiverSocket.connected) {
        notReceiverSocket.disconnect();
    }
    await io.close();
    await new Promise(resolve => server.close(resolve));
});

afterEach(() => {
    if (senderSocket && senderSocket.connected) {
        senderSocket.disconnect();
    }
    if (receiverSocket && receiverSocket.connected) {
        receiverSocket.disconnect();
    }
    if(notReceiverSocket && notReceiverSocket.connected) {
        notReceiverSocket.disconnect();
    }
});


describe('socket chat test', () => {
    // 
    test("send msg and check to recieve", done => {
        senderSocket = new Client(`http://localhost:${port}`, {
            auth: { username: sender, roomId: room.room_id }
        });
        receiverSocket = new Client(`http://localhost:${port}`, {
            auth: { username: receiver, roomId: room.room_id }
        });
        notReceiverSocket = new Client(`http://localhost:${port}`, {
            auth: { username: notReceiver, roomId: notreceiveRoom.room_id }
        });
        const chat = 'hello';
        senderSocket.on('connect', () => {
            senderSocket.emit('chatMsg', {msg: chat, toAI: false, chatHistory: []});
        });

        notReceiverSocket.on('chatMsg', () => {
            done().fail(new Error('not receiver should not receive msg.'));
        });

        receiverSocket.on('chatMsg', (data) => {
            expect(data.room_id).toBe(room.room_id);
            expect(data.sender_id).toBe(sender);
            expect(data.message).toBe(chat);
            done();
        });


    });
});