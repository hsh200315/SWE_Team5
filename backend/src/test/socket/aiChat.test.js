const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { socketAuth } = require('../../middlewares/socketIo');
const listenSocket = require("../../sockets");
const { makeRoom, inviteUsers } = require('../utils/initChatRoom');
const { initUsers } = require('../utils/initUser');
const initInMemoryDb = require('../utils/initDB');

let io, server, port;
let aliceSocket, bobSocket;
const roomName = 'aiTestRoom';
const sender = 'alice';
const receiver = 'bob';
let room;

beforeAll(async () => {
  server = http.createServer();
  io = new Server(server, {
    transports: ['polling', 'websocket']
  });

  await initInMemoryDb();
  await initUsers([sender, receiver]);
  room = await makeRoom(sender, roomName);
  await inviteUsers(room.room_id, [receiver]);

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
  aliceSocket.disconnect();
  bobSocket.disconnect();
  await io.close();
  await new Promise(resolve => server.close(resolve));
});

describe("AI_chat 스트리밍 테스트", () => {
  test("AI 응답이 토큰 단위로 여러 번 수신되는지", (done) => {
    const aliceTokens = [];
    const bobTokens = [];
    let aliceDone = false;
    let bobDone = false;
    const input = "안녕 GPT야 너에 대해서 소개해줘";

    aliceSocket = new Client(`http://localhost:${port}`, {
      auth: { username: sender, roomId: room.room_id }
    });

    bobSocket = new Client(`http://localhost:${port}`, {
      auth: { username: receiver, roomId: room.room_id }
    });

    function handleToken(user, tokenArray, token) {
        //console.log(`${user} 받은 토큰:`, token);
        tokenArray.push(token);
    }

    // 응답 종료 시 처리
    function handleDone() {
        if (aliceDone && bobDone) {
        const aText = aliceTokens.join('');
        const bText = bobTokens.join('');
        //console.log("Alice 응답:", aText);
        //console.log("Bob 응답:", bText);
        expect(aText).toBe(bText); // 동일한 응답을 받아야 함
        expect(aText.length).toBeGreaterThan(0);
        done();
        }
    }

    // 토큰 수신
    aliceSocket.on("AI_chat", (token) => handleToken("Alice", aliceTokens, token));
    bobSocket.on("AI_chat", (token) => handleToken("Bob", bobTokens, token));


    // 스트리밍 종료 수신
    aliceSocket.on("AI_chat_done", () => {
        aliceDone = true;
        handleDone();
    });
    bobSocket.on("AI_chat_done", () => {
        bobDone = true;
        handleDone();
    });

    aliceSocket.on('connect', () => {
      aliceSocket.emit("AI_chat", {
        input,
        chatList: ["안녕", "테스트"]  
      });
    });
  }, 10000);
});
