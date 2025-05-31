const { all,get, run } = require("../config/db");

module.exports = {
    // 특정 채팅방에 속한 사용자 목록 조회
    userlist: async (data) => {
        const {roomId} = data;
        try {
            const result  = await all('SELECT user_id FROM ChatRoomUser WHERE room_id = ? ORDER BY user_id ASC', [roomId]);
            return result;
        } catch (err) {
            return new Error(err);
        }
    },
    // 특정 사용자가 참여 중인 채팅방 목록 조회, updated 순으로 가져온다.
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
    // 채팅방 생성 및 사용자 자동 참여 (트랜잭션 처리)
    create: async (data) => {
        const {roomname} = data;
        try {
            const chatRoom = await run('INSERT INTO ChatRoom (room_name) VALUES (?)', [roomname]);
            const result = await get('SELECT room_id, room_name, updated_at FROM ChatRoom WHERE room_id = ?',[chatRoom.id]);
            return result;
        } catch (err) {
            return new Error(err);
        }
    },
    // 채팅방에 사용자 초대
    invite: async (data) => {
        const {username, roomId} = data;
        try {
            const result = await run('INSERT INTO ChatRoomUser (room_id, user_id) VALUES (?, ?)', [roomId, username]);
            return result;
        } catch (err) {
            return new Error(err);
        }
    },
    // 채팅방 나가기
    leave: async (data) => {
        const {username, roomId} = data;
        try {
            const result = await run('DELETE FROM ChatRoomUser WHERE room_id = ? AND user_id = ?', [roomId, username]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    // 특정 사용자가 해당 채팅방에 존재하는지 확인
    findById: async (data) => {
        const {username, roomId} = data;
        try {
            const result = await get('SELECT room_id, user_id FROM ChatRoomUser WHERE room_id = ? AND user_id = ?', [roomId, username]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    // 특정 채팅방의 전체 정보 조회
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