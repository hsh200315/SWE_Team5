const authModel = require('../models/auth.model');
const chatRoomModel = require("../models/chatRoom.model");
const makeRoomId = require('../utils/makeRoomId');

module.exports = {
    socketAuth: (io) => {
        io.use(async (socket, next) => {
            const { username, roomId } = socket.handshake.auth;    
            if (!username || !roomId) {
              return next(new Error('username and roomId must be required'));
            }
      
            // 1. username이 roomId 안에 없는 경우, 연결을 거부해야 한다.
            const isExistUsernameInRoom = await chatRoomModel.findById({username: username, roomId: roomId});
            if(!isExistUsernameInRoom) {
                return next(new Error(`user ${username} is not in room.`));
            }
            socket.username = username;
            socket.roomId = roomId;
            socket.join(makeRoomId(roomId));
            next();
          });
    }
}
