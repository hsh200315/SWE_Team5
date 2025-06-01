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
  await initUsers([sender, receiver,"SENA"]);
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


describe("travel_plan AI 스트리밍 테스트", () => {
  test("여러 유저가 travel_plan, coordinate 이벤트를 정상 수신하는지", (done) => {
    const aliceTokens = [];
    const bobTokens = [];
    const aliceCoordinates = [];
    const bobCoordinates = [];

    let aliceDone = false;
    let bobDone = false;

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

      function handleDone() {
        if (aliceDone && bobDone) {
            const aliceText = aliceTokens.join('');
            const bobText = bobTokens.join('');
            //console.log(bobText);

            expect(aliceText).toBe(bobText);
            expect(aliceText.length).toBeGreaterThan(0);
            //console.log(bobCoordinates);

            const aliceCoords = JSON.parse(aliceCoordinates[0].message);
            const bobCoords = JSON.parse(bobCoordinates[0].message);

            expect(Array.isArray(aliceCoords)).toBe(true);
            expect(aliceCoords.length).toBe(3);
            expect(aliceCoords).toEqual(bobCoords);

            done();
        }
      }

      // 이벤트 등록 - travel_plan
      aliceSocket.on("travel_plan", (data) => {
        aliceTokens.push(data.message);
      });

      bobSocket.on("travel_plan", (data) => {
        bobTokens.push(data.message);
      });

      // 이벤트 등록 - coordinate
      aliceSocket.on("coordinate", (data) => {
        aliceCoordinates.push(data);
        aliceDone = true;
        handleDone();
      });

      bobSocket.on("coordinate", (data) => {
        bobCoordinates.push(data);
        bobDone = true;
        handleDone();
      });

      // 3️⃣ 소켓 연결 후 요청 emit
      aliceSocket.on('connect', () => {
        aliceSocket.emit("travel_plan", {
          chatHistory: chatHistory
        });
      });

    })();
  }, 10000);
});