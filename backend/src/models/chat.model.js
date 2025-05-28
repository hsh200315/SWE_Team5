const { db, get, run, all } = require("../config/db");
const { encryptMessage, decryptMessage } = require("../utils/utils");

module.exports = {
    // roomId에 속하는 chat을 시간 내림차순으로 가져온다.
    chatlist: async(data) => {
        const {roomId} = data;
        try {
            let result = await all('SELECT * FROM Chat WHERE room_id = ? ORDER BY timestamp DESC', [roomId]);
            result = result.map((r) => {
                const messageDec = decryptMessage(r.message);
                return {
                    ...r,
                    message: messageDec
                };
            })
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
            // 메시지를 암호화하고
            const messageEnc = await encryptMessage(message);
            
            const result = await run(`INSERT INTO Chat(room_id, sender_id, message, is_from_AI, map_image) VALUES (?, ?, ?, ?, ?)`,
                [roomId, sender, messageEnc, isFromAI, mapImage]);
            
            const chatDataEnc = await get('SELECT * FROM Chat WHERE chat_id = ?', [result.id]);
            // 복호화해야 한다.
            const msgDec = decryptMessage(chatDataEnc.message);
            const chatData = {...chatDataEnc, message: msgDec};
            
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