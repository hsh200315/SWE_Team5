// chat을 정상적으로 가져오는지
const request = require('supertest');
const app = require("../../app");
const initInMemoryDb = require('../utils/initDB');
const { testAPIURL } = require('../utils/constants');
const { initUsers } = require('../utils/initUser');
const { run } = require('../../config/db');
const chatRoomModel = require('../../models/chatRoom.model');
const { inviteUsers } = require('../utils/initChatRoom');
const chatModel = require('../../models/chat.model');
const alice = 'alice';
const bob = 'bob';
let room;

beforeAll(async() => {
    await initInMemoryDb();
    await initUsers([alice,bob]);
    room = await chatRoomModel.create({username: alice, roomname: "testroom"});
    await inviteUsers(room.room_id, [bob]);
});

beforeEach(async () => {
    await run('DELETE FROM ChatRoomUser');
    await run('DELETE FROM ChatRoom');
});

describe('Chat API', () => {
    // 1. chatting을 시간 역순으로 가져온다.
    test(`POST ${testAPIURL}/rooms/:id/messages →2 00`, async () => {
        // 1. chatting을 보낸다.
        const chat1 = {
            roomId: room.room_id,
            sender: alice,
            message: 'first',
            isPlan: false,
            mapImage: null
        };
        const chat2 = {
            roomId: room.room_id,
            sender: bob,
            message: 'second',
            isPlan: false,
            mapImage: null
        };
        await chatModel.addchat(chat1);
        await chatModel.addchat(chat2);
        
        const res = await request(app)
        .get(`${testAPIURL}/rooms/${room.room_id}/messages`);
        // api를 통해 가져외서 개수가 2개인지 확인한다.
        expect(res.body.data.length).toBe(2);
        
    });
})