
const chatRoomModel = require("../../models/chatRoom.model");
const chatModel = require("../../models/chat.model");
const { inviteUsers, makeRoom } = require("../utils/initChatRoom");
const initInMemoryDb = require("../utils/initDB");
const { initUsers } = require("../utils/initUser");
const { run } = require("../../config/db");
const { sleep } = require("../utils/timeUtils");
let db,aliceRoom,bobRoom,charilRoom;
const alice = 'alice';
const bob = 'bob';
const charil = 'charil';
const usernames = ['alice', 'bob', 'charil']

beforeAll(async () => {
    db = await initInMemoryDb();
    // aliceRoom:[alice, bob], bobRoom:[bob, charil], charilRoom:[charil, alice] 방을 만든다.
    await initUsers(usernames);
    
    aliceRoom = await makeRoom(alice, `${alice}Room`);
    bobRoom = await makeRoom(bob,`${bob}Room`);
    charilRoom = await makeRoom(charil,`${charil}Room`);
    await inviteUsers(aliceRoom.room_id, [bob]);
    await inviteUsers(bobRoom.room_id, [charil]);
    await inviteUsers(charilRoom.room_id, [alice]);
});


beforeEach(async() => {
    await run('DELETE FROM Chat');
})


describe('User table test', () => {
    test('send chat', async() => {
        
        const chat = {
            roomId: aliceRoom.room_id,
            sender: alice,
            message: 'hello bob!',
            isPlan: false,
            mapImage: null
        }
       
        const result = await chatModel.addchat(chat);
        
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
            isPlan: false,
            mapImage: null
        };
        const chat2 = {
            roomId: room.room_id,
            sender: alice,
            message: 'second',
            isPlan: false,
            mapImage: null
        };
        const first = await chatModel.addchat(chat1);
        await sleep(1000);
        const second = await chatModel.addchat(chat2);
        const chats = await chatModel.chatlist({roomId: room.room_id});
        const roomInfo = await chatRoomModel.getRoom({roomId: room.room_id});
        
        expect(chats.length).toBe(2);
        

        expect(chats[0].message).toBe(chat2.message);
        expect(chats[1].message).toBe(chat1.message);
        
        expect(roomInfo.updated_at).toBe(second.timestamp);
    }),
    test('delete chat', async() => {
        const chat = {
            roomId: aliceRoom.room_id,
            sender: alice,
            message: 'hello bob!',
            isPlan: false,
            mapImage: null
        }
       
        const c = await chatModel.addchat(chat);
        const result = await chatModel.deleteById({chatId: c.chat_id});
        const chats = await chatModel.chatlist({roomId: aliceRoom.room_id});
        expect(chats.length).toBe(0);
    })
    }
)
