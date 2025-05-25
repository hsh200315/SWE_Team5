const { db, get, run, all } = require("../config/db");

module.exports = {
    // roomId에 속하는 chat을 시간 내림차순으로 가져온다.
    chatlist: async(data) => {
        const {roomId} = data;
        try {
            const result = await all('SELECT * FROM Chat WHERE room_id = ? ORDER BY timestamp DESC', [roomId]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    // 새로운 채팅을 추가한다.
    // 이 때 새로운 체팅방도 업데이트해야 한다.
    addchat: async (data) => {
        const {roomId, sender, message, isFromAI, mapImage} = data;
        try {
            await run('TRANSACTION BEGIN');
            
            const result = await run(`INSERT INTO Chat(room_id, sender_id, message, is_from_AI, map_image) VALUES (?, ?, ?, ?, ?)`,
                [roomId, sender, message, isFromAI, mapImage]);
            console.log(result);
            const chatData = await get('SELECT * FROM Chat WHERE chat_id = ?', [result.id]);
            await run(
                'UPDATE ChatRoom SET updated_at = ? WHERE room_id = ?',
                [chatData.timestamp, roomId]
              );
            await run('COMMIT');
            return chatData;
        } catch(err) {
            return new Error(err);
        }
    }
    
}