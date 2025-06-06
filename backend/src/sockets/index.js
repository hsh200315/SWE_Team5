
const chatModel = require('../models/chat.model');
const chatRoomModel = require('../models/chatRoom.model');
const { streamChat, travelPlanningPipeline } = require('../AI_model/chat_ai');
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
            let chatLogs = '';
            for (const chatId of chatHistory) {
                const result = await chatModel.findById({ chatId });
                if (result instanceof Error) {
                    socket.emit("AI-chat-error", {message: "msg is not sent because of AI chat error."});
                    continue;
                }
                chatLogs += `${result.sender_id}: ${result.message}\n`;
            }

            const data = travelPlanningPipeline(chatLogs, msg);
            let aiMessage = '';
            const aiChat = await chatModel.addchat({
                roomId: roomId, 
                sender: "Sena", 
                message: "",
                isPlan: false, 
                mapImage: null
            });
            try{
                await streamChat({
                    msg,
                    chatLogs,
                    onToken: (token) => {
                        aiMessage+=token;
                        io.to(makeRoomId(roomId)).emit("AI_chat", {
                            ...aiChat,
                            message: token
                        });
                    },
                    onDone: async () => {
                        await chatModel.updateMessage({
                            chat_id: aiChat.chat_id,
                            message: aiMessage
                        });

                        io.to(makeRoomId(roomId)).emit("AI_chat_done");
                    }
                });
            } catch (err) {
                socket.emit("AI-chat-error", {message: "msg is not sent because of AI chat error."});
            }
        }
    });
    // 해당 채팅방에 다른 사용자 초대하는 이벤트
    socket.on('invite', async (data) => {
        const roomId = socket.roomId;
        const {userlist} = data;
        // inviteUsername이 비어 있는 경우, 오류 응답 후 중단
        if(!userlist) {
            socket.emit("invite-error", {message: "userlist is empty."});
            return;
        }
        try {
            let successUserlist = []
            let failUserlist = []
            for (const username of userlist) {
                const isExist = await chatRoomModel.findById({username: username, roomId: roomId});
                if(isExist) failUserlist.push(username);
                else {
                    const res = await chatRoomModel.invite({username: username, roomId: roomId});
                    if(!res.id) failUserlist.push(username);
                    else successUserlist.push(username);
                }
                
            }
            // 해당 방에 속한 모든 클라이언트에게 초대 알림 전송
            io.to(makeRoomId(roomId)).emit("invite", {successUserlist: successUserlist, failUserlist: failUserlist});
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

    socket.on("travel_plan", async (data) => {
        const roomId = socket.roomId;
        const {chatHistory} = data;
        let chatLogs = '';;
        for (const chatId of chatHistory) {
            const result = await chatModel.findById({ chatId });
            if (result instanceof Error) {
                socket.emit("AI-chat-error", {message: "msg is not sent because of AI chat error."});
                continue;
            }
            chatLogs += `${result.sender_id}: ${result.message}\n`;
        }
        let aiMessage = '';
        const aiChat = await chatModel.addchat({
            roomId: roomId, 
            sender: "Sena", 
            message: "",
            isPlan: false, 
            mapImage: null
        });
        const coordinateChat = await chatModel.addchat({
            roomId: roomId, 
            sender: "Sena", 
            message: "",
            isPlan: true, 
            mapImage: null
        });
        const temp_coordinate = [
            [37.579617, 126.977041], 
            [37.551169, 126.988227],  
            [37.563757, 126.982677]   
        ];
        const temp_coord_str = JSON.stringify(temp_coordinate);
        const msg = "안녕 GPT야 너에 대해서 소개해줘"
        try{
            await streamChat({
                msg,
                chatLogs,
                onToken: (token) => {
                    aiMessage+=token;
                    io.to(makeRoomId(roomId)).emit("travel_plan", {
                        ...aiChat,
                        message: token
                    });
                },
                onDone: async () => {
                    await chatModel.updateMessage({
                        chat_id: coordinateChat.chat_id,
                        message: temp_coord_str
                    });

                    io.to(makeRoomId(roomId)).emit("coordinate",{
                        ...coordinateChat,
                        message:temp_coord_str
                    });
                }
            });
        } catch(err){
            socket.emit("Travel-plan-error", {message: "msg is not sent because of travel plan error."});
        }
        
    });
}