const chatRoomModel = require("../models/chatRoom.model");
const { makeRoomId } = require('../utils/utils');

module.exports = {
    // Socket.IO 미들웨어: 소켓 연결 시 사용자 인증 처리
    socketAuth: (io) => {
        io.use(async (socket, next) => {
            // 클라이언트가 handshake 시 전송한 인증 정보 가져오기
            const { username, roomId } = socket.handshake.auth;    
            // username 또는 roomId가 누락된 경우, 연결 거부
            if (!username || !roomId) {
              return next(new Error('username and roomId must be required'));
            }
      
            // 1. username이 roomId 안에 없는 경우, 연결을 거부해야 한다.
            const isExistUsernameInRoom = await chatRoomModel.findById({username: username, roomId: roomId});
            if(!isExistUsernameInRoom) {
                return next(new Error(`user ${username} is not in room.`));
            }
            // 인증 통과: 소켓 객체에 사용자 정보 저장
            socket.username = username;
            socket.roomId = roomId;
            // 해당 소켓을 room에 참가시키기 (서버 내에서 메시지를 방 단위로 전송 가능)
            socket.join(makeRoomId(roomId));
            // 연결 허용
            next();
          });
    }
}
