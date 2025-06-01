const { get, run, all } = require("../config/db");

module.exports = {
    // 특정 채팅방(roomId)에 속한 채팅 목록을 최신순(timestamp DESC)으로 가져옴
    chatlist: async(data) => {
        const {roomId} = data;
        try {
            const result = await all('SELECT * FROM Chat WHERE room_id = ? ORDER BY timestamp DESC', [roomId]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    // 새로운 채팅을 DB에 추가하고, 해당 채팅방의 업데이트 시간을 갱신함
    addchat: async (data) => {
        const {roomId, sender, message, isPlan, mapImage} = data;
        try {
            
            await run('BEGIN TRANSACTION');
            // 채팅 메시지 삽입
            const result = await run(`INSERT INTO Chat(room_id, sender_id, message, is_plan, map_image) VALUES (?, ?, ?, ?, ?)`,
                [roomId, sender, message, isPlan, mapImage]);
            
            const chatData = await get('SELECT * FROM Chat WHERE chat_id = ?', [result.id]);
            // 해당 채팅방의 최신 업데이트 시간 갱신
            await run(
                'UPDATE ChatRoom SET updated_at = ? WHERE room_id = ?',
                [chatData.timestamp, roomId]
              );
            await run('COMMIT');
            return chatData;
        } catch(err) {
            console.log(err);
            return new Error(err);
        }
    },
    // chatId로 특정 채팅 조회
    findById: async (data) => {
        const {chatId} = data;
        try {
            const result = await get("SELECT * FROM Chat WHERE chat_id = ?",[chatId]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    updateMessage: async ({ chat_id, message }) => {
        try {
            await run("UPDATE Chat SET message = ? WHERE chat_id = ?", [message, chat_id]);
            return true;
        } catch (err) {
            return new Error(err);
        }
    }
}