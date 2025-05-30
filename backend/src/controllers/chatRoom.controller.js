const { success, failed } = require("../utils/response");
const authModel = require("../models/auth.model");
const chatRoomModel = require("../models/chatRoom.model");

module.exports = {
    createRoom: async (req, res) => {
        try {
            const {username, roomname} = req.body;
            if(!username || !roomname) {
                return failed(res, {
                    code: 400,
                    message: 'BAD REQUEST',
                    error: 'username and roomname required.'
                });
            }
            const isExistUsername = await authModel.findById({username: username});
            if(!isExistUsername) {
                return failed(res, {
                    code: 404,
                    message: `user ${username} not existed`,
                    error: 'USER NOT FOUND'
                    });
                }
            const result = await chatRoomModel.create({username: username, roomname: roomname});
            return success(res, {
                code: 201,
                message: 'Success make room',
                data: {roomId: result.room_id, roomname: result.room_name, updated_at: result.updated_at}
            });
        } catch(err) {
            return failed(res, {
                code: 500,
                message: error.message,
                error: 'Internal Server Error'
            });
        }
    },
    getUserList: async (req, res) => {
        try {
            const roomId = parseInt(req.params.id);
            const result = await chatRoomModel.userlist({roomId: roomId});
            if(result.length == 0) {
                return failed(res,{
                    code: 404,
                    message: "room not existed",
                    error: "ROOM NOT FOUND"
                });
            }
            
            return success(res, {
                code: 200,
                message: "Success get UserList.",
                data: result
            });
        } catch(err) {
            return failed(res, {
                code: 500,
                message: error.message,
                error: 'Internal Server Error'
            });
        }
    },
    getRoomList: async (req, res) => {
        try {
            const {username} = req.body;
            if(!username) {
                return failed(res, {
                    code: 400,
                    message: 'BAD REQUEST',
                    error: 'username required.'
                });
            }
            const isExistUsername = await authModel.findById({username: username});
            if(!isExistUsername) {
                return failed(res, {
                    code: 404,
                    message: `user ${username} not existed`,
                    error: 'USER NOT FOUND'
                    });
            }
            const result = await chatRoomModel.roomlist({username: username});
            
            return success(res, {
                code: 200,
                message: "Success get roomlist.",
                data: result
            })
        } catch(err) {
            return failed(res, {
                code: 500,
                message: error.message,
                error: 'Internal Server Error'
            });
        }
    }
}