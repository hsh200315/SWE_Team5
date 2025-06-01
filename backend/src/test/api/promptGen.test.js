const request = require('supertest');
const app = require("../../app");
const initInMemoryDb = require('../utils/initDB');
const { testAPIURL } = require('../utils/constants');
const { initUsers } = require('../utils/initUser');
const { run } = require('../../config/db');
const chatModel = require('../../models/chat.model'); 
const { makeRoom, inviteUsers } = require('../utils/initChatRoom');
const usernames = ['alice'];
let room;
const sender = 'alice';
const roomName = 'prompt-gen-room';
beforeAll(async () => {
    await initInMemoryDb();
    await initUsers(usernames);
    room = await makeRoom(sender, roomName);
    await inviteUsers(room.room_id, ['bob']);
});

// beforeEach(async () => {
//     await run('DELETE FROM ChatRoomUser');
//     await run('DELETE FROM ChatRoom');
//     await run('DELETE FROM Chat'); 
// });

describe('promptGeneration API 테스트', () => {
  test(`POST ${testAPIURL}/ai/prompt-generation 정상 동작`, async () => {
    const chat1 = await chatModel.addchat({
      roomId: room.room_id,
      sender: 'alice',
      message: "나는 다음주 제주도에 가려고 해",
      isPlan: false,
      mapImage: null
    });
    //console.log(chat1.chat_id);
    const chat2 = await chatModel.addchat({
      roomId: room.room_id,
      sender: 'alice',
      message: "제주도에서 꼭 가봐야 할 곳 알려줘",
      isPlan: false,
      mapImage: null
    });

    const chatHistory = [chat1.chat_id, chat2.chat_id];
    const msg = "가족이랑 같이 갈건데 숙소 추천해줘";


    const res = await request(app)
      .post(`${testAPIURL}/ai/prompt-generation`)
      .send({
        chatHistory,
        msg
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.message).toBe("Successfully generate prompt.");
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data).toBe("string");
    console.log(res.body.data);
  }, 10000);
});