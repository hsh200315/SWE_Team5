const { get,run } = require("../../config/db");

const chatRoomModel = require("../../models/chatRoom.model");
const initInMemoryDb = require("../utils/initDB");
const { initUsers } = require("../utils/initUser");
const { sleep } = require("../utils/timeUtils");

let db;

const usernames = ['alice', 'bob', 'charie']

beforeAll(async () => {
    db = await initInMemoryDb();
    await initUsers(usernames);
});
// test case가 하나씩 끝날 때마다 database를 clear해야 한다.
afterAll(async () => {
    await db.close();
});
// 매 테스트케이스 시작하기 전 같은 db 상태 유지 보장
beforeEach(async () => {
    await run('DELETE FROM ChatRoomUser');
    await run('DELETE FROM ChatRoom');
});


describe('chatroom table test', () => {
    test("create Room", async() => {
        const username = usernames[0];
        const roomname = `${username}'s room`;
        const result = await chatRoomModel.create({roomname: roomname});
        expect(result.room_id).toBe(1);
        expect(result.room_name).toBe(roomname);
        
    }),
    test('invite user', async() => {
        
        const username = usernames[0];
        const roomname = `${username}'s room`;
        const chatRoom = await chatRoomModel.create({roomname: roomname});
        const inviteUsername = usernames[1];
        await chatRoomModel.invite({username: inviteUsername, roomId: chatRoom.room_id});
        const result = await chatRoomModel.findById({username: inviteUsername, roomId: chatRoom.room_id});
        expect(result).toMatchObject({room_id: chatRoom.room_id, user_id: inviteUsername});
       
    }),
    test('get roomlist', async() => {
        const username = usernames[0];
        const roomname1 = `${username}'s room1`;
        const roomname2 = `${username}'s room2`;
        const room1 = await chatRoomModel.create({roomname: roomname1});
        await chatRoomModel.invite({username: username, roomId: room1.room_id});
        await sleep(1000);
        const room2 = await chatRoomModel.create({roomname: roomname2});
        await chatRoomModel.invite({username: username, roomId: room2.room_id});
        const roomlist = await chatRoomModel.roomlist({username: username});
        // 채팅방 2개인지 확인
        expect(roomlist.length).toBe(2);
        // update 내림차순 순으로 잘 가져오는지 확인
        expect(roomlist[0].room_id).toBe(room2.room_id);
        expect(roomlist[1].room_id).toBe(room1.room_id);
        
    }),
    test('get userlist', async() => {
        const username = usernames[0];
        const roomname = `${username}'s room`;
        const chatRoom = await chatRoomModel.create({roomname: roomname});
        const inviteUsername = usernames[1];
        await chatRoomModel.invite({username: username, roomId: chatRoom.room_id})
        await chatRoomModel.invite({username: inviteUsername, roomId: chatRoom.room_id});
        const userlist = await chatRoomModel.userlist({roomId: chatRoom.room_id});
        // 이름순으로 가져와지는지 확인
        expect(userlist[0].user_id).toBe(username);
        expect(userlist[1].user_id).toBe(inviteUsername);
    }),
    test('leave user', async() => {
        const username = usernames[0];
        const roomname = `${username}'s room`;
        const chatRoom = await chatRoomModel.create({username: username, roomname: roomname});
        const inviteUsername = usernames[1];
        await chatRoomModel.invite({username: inviteUsername, roomId: chatRoom.room_id});
        await chatRoomModel.leave({username: inviteUsername, roomId: chatRoom.room_id});
        const result = await chatRoomModel.findById({username: inviteUsername, roomId: chatRoom.room_id});
        expect(result).toBeUndefined();
    })
})
