const { addchat } = require("../models/chat.model");
const chatRoomModel = require("../models/chatRoom.model");
const chatModel = require("../models/chat.model");
const { inviteUsers } = require("./utils/initChatRoom");
const initInMemoryDb = require("./utils/initDB");
const { initUsers } = require("./utils/initUser");
const { run } = require("../config/db");
const { sleep } = require("./utils/timeUtils");
let db,aliceRoom,bobRoom,charilRoom;
const alice = 'alice';
const bob = 'bob';
const charil = 'charil';
const usernames = ['alice', 'bob', 'charil']

beforeAll(async () => {
    db = await initInMemoryDb();
    // aliceRoom:[alice, bob], bobRoom:[bob, charil], charilRoom:[charil, alice] 방을 만든다.
    await initUsers(usernames);
    
    aliceRoom = await chatRoomModel.create({username: alice, roomname: `${alice}Room`});
    bobRoom = await chatRoomModel.create({username: bob, roomname: `${bob}Room`});
    charilRoom = await chatRoomModel.create({username: charil, roomname: `${charil}Room`});
    await inviteUsers(aliceRoom.room_id, [bob]);
    await inviteUsers(bobRoom.room_id, [charil]);
    await inviteUsers(charilRoom.room_id, [alice]);
});
  
afterAll(async () => {
    await db.close();
});

beforeEach(async() => {
    await run('DELETE FROM Chat');
})


describe('User table test', () => {
    test('send chat', async() => {
        // alice가 톡방에 chat을 올리고,
        const chat = {
            roomId: aliceRoom.room_id,
            sender: alice,
            message: 'hello bob!',
            isFromAI: false,
            mapImage: null
        }
        // 챗 개수가 1이고
        const result = await chatModel.addchat(chat);
        // 챗 내용과 sender와 room_id가 같은지
        expect(result.room_id).toBe(chat.roomId);
        expect(result.sender_id).toBe(chat.sender);
        expect(result.message).toBe(chat.message);

    }),
    test('get chats correctly ordered and update chatroom info', async() => {
        const room = aliceRoom;
        const chat1 = {
            roomId: room.room_id,
            sender: alice,
            message: 'first',
            isFromAI: false,
            mapImage: null
        };
        const chat2 = {
            roomId: room.room_id,
            sender: alice,
            message: 'second',
            isFromAI: false,
            mapImage: null
        };
        const first = await chatModel.addchat(chat1);
        await sleep(1000);
        const second = await chatModel.addchat(chat2);
        const chats = await chatModel.chatlist({roomId: room.room_id});
        const roomInfo = await chatRoomModel.getRoom({roomId: room.room_id});
        
        expect(chats.length).toBe(2);
        console.log(chats)

        expect(chats[0].message).toBe(chat2.message);
        expect(chats[1].message).toBe(chat1.message);
        
        expect(roomInfo.updated_at).toBe(second.timestamp);
    })
    }
)
