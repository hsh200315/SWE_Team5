const { all,get, run } = require("../config/db");

module.exports = {
    // id인 room에 속해있는 user를 다 가져온다.
    // 이름을 오름차순으로 가젼온다.
    userlist: async (data) => {
        const {roomId} = data;
        try {
            const result  = await all('SELECT user_id FROM ChatRoomUser WHERE room_id = ? ORDER BY user_id ASC', [roomId]);
            return result;
        } catch (err) {
            return new Error(err);
        }
    },
    // username이 속한 room을 다 가져온다. 이 때. roomId와 roomName 둘 다 가져와야 한다.
    // 이 때 마지막 채팅이 가장 최신인 chat room list로 가져온다.
    roomlist: async (data) => {
        const {username} = data;
        try {
            const sql = `SELECT cr.room_id, cr.room_name, cr.updated_at FROM ChatRoom AS cr JOIN ChatRoomUser AS cru ON cr.room_id = cru.room_id WHERE cru.user_id = ? ORDER BY cr.updated_at DESC`;
            const result = await all(sql, [username]);
            return result;
        } catch (err) {
            return new Error(err);
        }
    },
    // username이 roomname 방을 만든다.
    create: async (data) => {
        const {username, roomname} = data;
        try {
            await run('BEGIN TRANSACTION');
            const chatRoom = await run('INSERT INTO ChatRoom (room_name, owner_id) VALUES (?, ?)', [roomname, username]);
            await run('INSERT INTO ChatRoomUser (room_id, user_id) VALUES (?, ?)', [chatRoom.id, username]);
            await run('COMMIT');
            const result = await get('SELECT room_id, room_name, owner_id, updated_at FROM ChatRoom WHERE room_id = ?',[chatRoom.id]);
            return result;
        } catch (err) {
            return new Error(err);
        }
    },
    // user를 roomId에 초대한다.
    invite: async (data) => {
        const {username, roomId} = data;
        try {
            const result = await run('INSERT INTO ChatRoomUser (room_id, user_id) VALUES (?, ?)', [roomId, username]);
            return result;
        } catch (err) {
            return new Error(err);
        }
    },
    // user가 roomId 방에서 나간다.
    leave: async (data) => {
        const {username, roomId} = data;
        try {
            const result = await run('DELETE FROM ChatRoomUser WHERE room_id = ? AND user_id = ?', [roomId, username]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    findById: async (data) => {
        const {username, roomId} = data;
        try {
            const result = await get('SELECT room_id, user_id FROM ChatRoomUser WHERE room_id = ? AND user_id = ?', [roomId, username]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    getRoom: async (data) => {
        const {roomId} = data;
        try {
            const result = await get('SELECT * FROM ChatRoom WHERE room_id = ?', [roomId]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    }
}