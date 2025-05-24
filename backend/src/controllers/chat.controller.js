const { db, run, get } = require("../config/db");
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
                message: error.message,
                error: 'Internal Server Error'
            });
        }
    }
}