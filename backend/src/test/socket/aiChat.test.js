const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { socketAuth } = require('../../middlewares/socketIo');
const listenSocket = require("../../sockets");
const { makeRoom, inviteUsers } = require('../utils/initChatRoom');
const { initUsers } = require('../utils/initUser');
const initInMemoryDb = require('../utils/initDB');
const chatModel = require('../../models/chat.model');

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
  await initUsers([sender, receiver, "Sena"]);
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
describe('socket chat test', () => {
  test("AI 응답이 chatMsg를 통해 토큰 단위로 수신되는지", (done) => {
    const aliceTokens = [];
    const bobTokens = [];
    let aliceDone = false;
    let bobDone = false;
    const input = "안녕 GPT야 너에 대해서 소개해줘";

    (async () => {
      const chat1 = await chatModel.addchat({
        roomId: room.room_id,
        sender: sender,
        message: "이전 채팅 메시지 1",
        isPlan: false,
        mapImage: null
      });

      const chat2 = await chatModel.addchat({
        roomId: room.room_id,
        sender: receiver,
        message: "이전 채팅 메시지 2",
        isPlan: false,
        mapImage: null
      });
      const chatHistory = [chat1.chat_id, chat2.chat_id];

      aliceSocket = new Client(`http://localhost:${port}`, {
        auth: { username: sender, roomId: room.room_id }
      });

      bobSocket = new Client(`http://localhost:${port}`, {
        auth: { username: receiver, roomId: room.room_id }
      });

      function handleToken(user, tokenArray, data) {
        //console.log(`${user} 받은 토큰:`, data.message);
        tokenArray.push(data.message);
      }

      function handleDone() {
        if (aliceDone && bobDone) {
          const aText = aliceTokens.join('');
          const bText = bobTokens.join('');
          //console.log("최종 Alice 응답:", aText);
          //console.log("최종 Bob 응답:", bText);
          expect(aText).toBe(bText);
          expect(aText.length).toBeGreaterThan(0);
          done();
        }
      }

      aliceSocket.on("AI_chat", (data) => handleToken("Alice", aliceTokens, data));
      bobSocket.on("AI_chat", (data) => handleToken("Bob", bobTokens, data));

      aliceSocket.on("AI_chat_done", () => {
        aliceDone = true;
        handleDone();
      });

      bobSocket.on("AI_chat_done", () => {
        bobDone = true;
        handleDone();
      });

      aliceSocket.on('connect', () => {
        aliceSocket.emit("chatMsg", {
          msg: input,
          toAI: true,
          chatHistory: chatHistory
        });
      });
    })();
  }, 10000);
});