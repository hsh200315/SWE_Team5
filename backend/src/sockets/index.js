const authModel = require('../models/auth.model');
const chatModel = require('../models/chat.model');
const chatRoomModel = require('../models/chatRoom.model');
const { streamChat } = require('../AI_model/chat_ai');
const { makeRoomId } = require('../utils/utils');


module.exports = (io, socket) => {
    // 다른 사용자에게 메시지 보내는 이벤트
    socket.on('chatMsg',async (data) => {
        // 클라이언트에서 보낸 데이터에서 메시지, AI에게 물어볼지에 대한 여부, 이전 채팅 기록 추출
        const {msg, toAI, chatHistory} = data;
        // 현재 소켓이 속한 채팅방 Id와 사용자 이름
        const roomId = socket.roomId;
        const username = socket.username;

        try {
            // DB에 채팅 기록 저장
            const chat = await chatModel.addchat({roomId: roomId, sender: username, message: msg, isPlan: false, mapImage: null});
            // 해당 방에 있는 모든 클라이언트에게 새 메시지 전송
            io.to(makeRoomId(roomId)).emit('chatMsg', chat);
        } catch {
            socket.emit("server-error", {message: "msg is not sent because of server error."});
        }
        if(toAI) {
            
        }
    });
    // 해당 채팅방에 다른 사용자 초대하는 이벤트
    socket.on('invite', async (data) => {
        const roomId = socket.roomId;
        const {inviteUsername} = data;
        // inviteUsername이 비어 있는 경우, 오류 응답 후 중단
        if(!inviteUsername) {
            socket.emit("invite-error", {message: "inviteUsername is empty."});
            return;
        }
        try {
            // 초대하려는 사용자가 실제 존재하는지 확인
            const isExistUsername = await authModel.findById({username: inviteUsername});
            if(!isExistUsername) {
                socket.emit("invite-error", {message: `user ${inviteUsername} is not existed`});
                return;
            }
            // 이미 해당 방에 초대된 사용자인지 확인
            const isExistInviteUsernameInRoom = await chatRoomModel.findById({username: inviteUsername, roomId: roomId});
            if(isExistInviteUsernameInRoom) {
                socket.emit("invite-error", {message: `user ${inviteUsername} is already invited`});
                return;
            }
            // 사용자 초대 로직 수행 (DB에 초대 정보 저장 등)
            await chatRoomModel.invite({username: inviteUsername, roomId: roomId});
            // 해당 방에 속한 모든 클라이언트에게 초대 알림 전송
            io.to(makeRoomId(roomId)).emit("invite", {username: inviteUsername});
        } catch {
            socket.emit("server-error", {message: "user is not invited because of server error."});
        }
    });
    // 해당 채팅방에 사용자가 나가는 이벤트
    socket.on('leave', async (data) => {
        const roomId = socket.roomId;
        const username = socket.username;
        try {
            // 사용자가 현재 방에 존재하는지 확인
            const isExistUsernameInRoom = await chatRoomModel.findById({username: username, roomId: roomId});
            // 이미 떠난 사용자라면 에러 메시지 전송
            if(!isExistUsernameInRoom) {
                socket.emit("leave-error", {message: `user ${username} is already left.`});
                return;
            }
            // 채팅방에서 사용자 정보 제거 (DB 등에서 처리)
            await chatRoomModel.leave({username: username, roomId: roomId});
            // 모든 참가자에게 해당 사용자가 방을 떠났음을 알림
            io.to(makeRoomId(roomId)).emit("leave", {username: username});
        } catch {
            socket.emit("server-error", {message: "user is not left because of server error"});
        }
    });

    socket.on("AI_chat", async ({ input, chatList }) => {

        const roomId = socket.roomId;
        // AI에게 질문하는 내용 자체도 다른 사람들에게 전송이 되어야 함. 이 부분을 어떻게 처리할 지 논의해보기
        await streamChat({
            input,
            chatList,
            onToken: (token) => {
                io.to(makeRoomId(roomId)).emit("AI_chat", token);
            },
            onDone: () => {
                io.to(makeRoomId(roomId)).emit("AI_chat_done");
            }
        });
    });
}