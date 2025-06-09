const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { socketAuth } = require('../../middlewares/socketIo');
const listenSocket = require("../../sockets");
const { makeRoom, inviteUsers } = require('../utils/initChatRoom');
const { initUsers } = require('../utils/initUser');
const initInMemoryDb = require('../utils/initDB');
const chatModel = require('../../models/chat.model');
const { run } = require('../../config/db');
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
  await initUsers([sender, receiver,"Sena"]);
  room = await makeRoom(sender, roomName);
  await inviteUsers(room.room_id, [receiver]);
  const preloadedPlaces = [
    { name: "한공간", lat: 37.56103280000001, lng: 126.9204141 },
    { name: "정식당", lat: 37.5256734, lng: 127.0410846 },
    { name: "지화자", lat: 37.5870767, lng: 126.9693932 }
  ];
  for (const place of preloadedPlaces) {
    await run(`
      INSERT OR REPLACE INTO PlaceCoord (name, lat, lng)
      VALUES (?, ?, ?)
    `, [place.name, place.lat, place.lng]);
  }
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
        message: "한공간, 정식당, 지화자 가는거 어때?",
        isPlan: false,
        mapImage: null
      });

      const chat2 = await chatModel.addchat({
        roomId: room.room_id,
        sender: receiver,
        message: "명동난타극장도 가자",
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
          
          expect(aliceText).toBe(bobText);
          expect(aliceText.length).toBeGreaterThan(0);
          
          const aliceCoords = JSON.parse(aliceCoordinates[0].message);
          const bobCoords = JSON.parse(bobCoordinates[0].message);

          expect(Array.isArray(aliceCoords)).toBe(true);
          expect(Array.isArray(bobCoords)).toBe(true);

          expect(aliceCoords).toEqual(bobCoords);
          
          // 좌표 개수는 1개 이상일 것만 검증 (이제는 유동적)
          expect(aliceCoords.length).toBeGreaterThanOrEqual(1);

          // 각 좌표가 [lat, lng] 형식인지 확인
          for (const coord of aliceCoords) {
            expect(Array.isArray(coord)).toBe(true);
            expect(coord.length).toBe(2);
            expect(typeof coord[0]).toBe("number");
            expect(typeof coord[1]).toBe("number");
          }

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

      bobSocket.on("Travel-plan-error", (data) => {
        console.log(data);
        expect(data.message).toBe("This room is already being processed.");
        errorReceived = true;
      });

      // 소켓 연결 후 요청 emit
      aliceSocket.on('connect', () => {
        aliceSocket.emit("travel_plan", {
          chatHistory: chatHistory
        });
        setTimeout(() => {
          bobSocket.emit("travel_plan", { chatHistory });
        }, 10);
      });

    })();
  }, 40000);
});