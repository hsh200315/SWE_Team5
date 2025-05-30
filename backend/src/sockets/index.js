const authModel = require('../models/auth.model');
const chatModel = require('../models/chat.model');
const chatRoomModel = require('../models/chatRoom.model');
const { streamChat } = require('../AI_model/chat_ai');
const { makeRoomId } = require('../utils/utils');


module.exports = (io, socket) => {
    // toAI: AI에게 질문할 것인지.
    // history: 이전 chatting들의 ID
    socket.on('chatMsg',async (data) => {
        // db에 먼저 저장한다. 만약 db에 저장이 안되면 error를 반환한다.
        const {msg, toAI, chatHistory} = data;
        const roomId = socket.roomId;
        const username = socket.username;
        try {
            const chat = await chatModel.addchat({roomId: roomId, sender: username, message: msg, isPlan: false, mapImage: null});
            io.to(makeRoomId(roomId)).emit('chatMsg', chat);
        } catch {
            socket.emit("server-error", {message: "msg is not sent because of server error."});
        }
        if(toAI) {
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
                sender: "SENA", 
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
    socket.on('invite', async (data) => {
        const roomId = socket.roomId;
        const {inviteUsername} = data;
        if(!inviteUsername) {
            socket.emit("invite-error", {message: "inviteUsername is empty."});
            return;
        }
        try {
            const isExistUsername = await authModel.findById({username: inviteUsername});
            if(!isExistUsername) {
                socket.emit("invite-error", {message: `user ${inviteUsername} is not existed`});
                return;
            }
            const isExistInviteUsernameInRoom = await chatRoomModel.findById({username: inviteUsername, roomId: roomId});
            if(isExistInviteUsernameInRoom) {
                socket.emit("invite-error", {message: `user ${inviteUsername} is already invited`});
                return;
            }
            
            await chatRoomModel.invite({username: inviteUsername, roomId: roomId});
            io.to(makeRoomId(roomId)).emit("invite", {username: inviteUsername});
        } catch {
            socket.emit("server-error", {message: "user is not invited because of server error."});
        }
    });
    socket.on('leave', async (data) => {
        const roomId = socket.roomId;
        const username = socket.username;
        try {
            const isExistUsernameInRoom = await chatRoomModel.findById({username: username, roomId: roomId});
            
            if(!isExistUsernameInRoom) {
                socket.emit("leave-error", {message: `user ${username} is already left.`});
            }
            await chatRoomModel.leave({username: username, roomId: roomId});
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
            sender: "SENA", 
            message: "",
            isPlan: false, 
            mapImage: null
        });
        const coordinateChat = await chatModel.addchat({
            roomId: roomId, 
            sender: "SENA", 
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