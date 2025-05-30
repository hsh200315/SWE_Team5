const { success, failed } = require("../utils/response");
const chatModel = require("../models/chat.model");

module.exports = {
    // 채팅방 ID에 해당하는 채팅 목록을 가져오는 API
    getChatList: async(req, res) => {
        try {
            const roomId = parseInt(req.params.id);
            // chatModel을 통해 해당 채팅방의 채팅 리스트 조회
            const result = await chatModel.chatlist({roomId: roomId});
            // 성공 응답 반환
            return success(res, {
                code: 200,
                message: "Success get chatList.",
                data: result
            });
        } catch(err) {
            return failed(res, {
                code: 500,
                message: 'server error',
                error: error.message
            });
        }
    }
}