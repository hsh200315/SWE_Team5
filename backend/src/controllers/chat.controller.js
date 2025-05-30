
const { success, failed } = require("../utils/response");
const chatModel = require("../models/chat.model");

module.exports = {
    getChatList: async(req, res) => {
        try {
            const roomId = parseInt(req.params.id);
            const result = await chatModel.chatlist({roomId: roomId});
            
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