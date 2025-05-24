const { success, failed } = require("../config/response");
const chatRoomModel = require("../models/chatRoom.model");
const authModel = require('../models/auth.model');
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
            const result = await chatRoomModel.create({username: username, roomname: roomname});
            return success(res, {
                code: 201,
                message: 'Success make room',
                data: {roomId: result.room_id, owner: result.owner_id, roomname: result.room_name}
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
    },
    // inviteUser: async (req, res) => {
    //     try {
    //         const {username, inviteUsername} = req.body;
    //         const roomId = parseInt(req.params.id);

    //         const isExistUsername = await authModel.findById({username: username});
            
    //         if(!isExistUsername) {
    //             return failed(res, {
    //                 code: 404,
    //                 message: `user ${username} not existed`,
    //                 error: 'NOT FOUND'
    //             });
    //         }
    //         const isExistInviteUsername = await authModel.findById({username: inviteUsername});
            
    //         if(!isExistInviteUsername) {
    //             return failed(res, {
    //                 code: 404,
    //                 message: `user ${inviteUsername} not existed`,
    //                 error: 'NOT FOUND'
    //             });
    //         }
    //         const isExistUsernameInRoom = await chatRoomModel.findById({username: username, roomId: roomId});
    //         //username이 roomId에 없는 경우,
    //         if(!isExistUsernameInRoom) {
    //             return failed(res, {
    //                 code: 404,
    //                 message: `user ${username} not in room.`,
    //                 error: 'ACCESS_DENIED'
    //             });
    //         }
    //         const isExistInviteUsernameInRoom = await chatRoomModel.findById({username: username, roomId: roomId});
    //         if(isExistInviteUsernameInRoom) {
    //             return failed(res, {
    //                 code: 409,
    //                 message: `user ${inviteUsername} is alreay in room.`,
    //                 error: 'Conflict'
    //             });
    //         }
            
    //         await chatRoomModel.invite({username: inviteUsername, roomId: roomId});
    //         return success(res, {
    //             code: 201,
    //             message: `Success Inviting User ${inviteUsername}` 
    //         });
    //     } catch(err) {
    //         return failed(res, {
    //             code: 500,
    //             message: error.message,
    //             error: 'Internal Server Error'
    //         });
    //     }
    // },
    // leaveRoom: async (req, res) => {
    //     try {
    //         const {username} = req.body;
    //         const roomId = parseInt(req.params.id);
    //         const isExistUsernameInRoom = await chatRoomModel.findById({username: username, roomId: roomId});
    //         if(!isExistUsernameInRoom) {
    //             return failed(res, {
    //                 code: 404,
    //                 message: `user ${username} not in room.`,
    //                 error: 'ACCESS_DENIED'
    //             });
    //         }
            
    //     } catch(err) {
    //         return failed(res, {
    //             code: 500,
    //             message: error.message,
    //             error: 'Internal Server Error'
    //         });
    //     }
    // },
    
}