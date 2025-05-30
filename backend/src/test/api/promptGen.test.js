const request = require('supertest');
const app = require("../../app");
const initInMemoryDb = require('../utils/initDB');
const { testAPIURL } = require('../utils/constants');
const { initUsers } = require('../utils/initUser');
const { run } = require('../../config/db');
const chatModel = require('../../models/chat.model');  // chatModel import

const usernames = ['alice'];

beforeAll(async () => {
    await initInMemoryDb();
    await initUsers(usernames);
});

beforeEach(async () => {
    await run('DELETE FROM ChatRoomUser');
    await run('DELETE FROM ChatRoom');
    await run('DELETE FROM Chat');  // chat 초기화 꼭 추가
});

describe('promptGeneration API 테스트', () => {
  test(`POST ${testAPIURL}/ai/prompt-generation 정상 동작`, async () => {
    // 1️⃣ 채팅 로그 2개 생성
    const chat1 = await chatModel.addchat({
      roomId: 1,
      sender: 'alice',
      message: "나는 다음주 제주도에 가려고 해",
      isPlan: false,
      mapImage: null
    });

    const chat2 = await chatModel.addchat({
      roomId: 1,
      sender: 'alice',
      message: "제주도에서 꼭 가봐야 할 곳 알려줘",
      isPlan: false,
      mapImage: null
    });

    const chatHistory = [chat1.chat_id, chat2.chat_id];
    const msg = "가족이랑 같이 갈건데 숙소 추천해줘";

    // 2️⃣ API 호출
    const res = await request(app)
      .post(`${testAPIURL}/ai/prompt-generation`)
      .send({
        chatHistory,
        msg
      });

    // 3️⃣ 결과 검증
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.message).toBe("Successfully generate prompt.");
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data).toBe("string");
    console.log(res.body.data);
  }, 10000);
});
