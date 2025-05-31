const { success, failed } = require("../utils/response");
const authModel = require("../models/auth.model");
const chatRoomModel = require("../models/chatRoom.model");

module.exports = {
    // 채팅방 생성 API
    createRoom: async (req, res) => {
        try {
            const {userlist,roomname} = req.body;
            // 필수 파라미터 누락 시 400 Bad Request 반환
            if(!userlist || !roomname) {
                return failed(res, {
                    code: 400,
                    message: 'BAD REQUEST',
                    error: 'userlist and roomname required.'
                });
            }
            const room = await chatRoomModel.create({roomname: roomname});

            let successUserlist = []
            let failUserlist = []
            for (const username of userlist) {
                console.log(username)
                const res = await chatRoomModel.invite({username: username, roomId: room.room_id});
                if(!res.id) failUserlist.push(username);
                else successUserlist.push(username);
            
            }
            return success(res, {
                code: 201,
                message: 'Success make room',
                data: {room_id: room.room_id, room_name: room.room_name, updated_at: room.updated_at, successUserlist: successUserlist, failUserlist: failUserlist}
            });
        } catch(err) {
            return failed(res, {
                code: 500,
                message: err.message,
                error: 'Internal Server Error'
            });
        }
    },
    // 특정 채팅방의 유저 리스트 조회
    getUserList: async (req, res) => {
        try {
            const roomId = parseInt(req.params.id);
            const result = await chatRoomModel.userlist({roomId: roomId});
            // 채팅방이 존재하지 않거나 유저가 없는 경우
            if(result.length == 0) {
                return failed(res,{
                    code: 404,
                    message: "room not existed",
                    error: "ROOM NOT FOUND"
                });
            }
            // 유저 리스트 반환
            return success(res, {
                code: 200,
                message: "Success get UserList.",
                data: result
            });
        } catch(err) {
            return failed(res, {
                code: 500,
                message: err.message,
                error: 'Internal Server Error'
            });
        }
    },
    // 유저가 속한 채팅방 리스트 조회
    getRoomList: async (req, res) => {
        try {
            const {username} = req.body;
            // username 없을 시 400 오류
            if(!username) {
                return failed(res, {
                    code: 400,
                    message: 'BAD REQUEST',
                    error: 'username required.'
                });
            }
            // 사용자 존재 확인
            const isExistUsername = await authModel.findById({username: username});
            if(!isExistUsername) {
                return failed(res, {
                    code: 404,
                    message: `user ${username} not existed`,
                    error: 'USER NOT FOUND'
                    });
            }
            // 채팅방 리스트 조회
            const result = await chatRoomModel.roomlist({username: username});
            
            return success(res, {
                code: 200,
                message: "Success get roomlist.",
                data: result
            })
        } catch(err) {
            return failed(res, {
                code: 500,
                message: err.message,
                error: 'Internal Server Error'
            });
        }
    }
}