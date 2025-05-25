const authModel = require('../models/auth.model');
const chatModel = require('../models/chat.model');
const chatRoomModel = require('../models/chatRoom.model');
const makeRoomId = require('../utils/makeRoomId');

module.exports = (io, socket) => {
    socket.on('chatMsg',async (msg) => {
        // db에 먼저 저장한다. 만약 db에 저장이 안되면 error를 반환한다.

        const roomId = socket.roomId;
        const username = socket.username;
        try {
            await chatModel.addchat({roomId: roomId, username: username, message: msg, isFromAI: false, mapImage: null});
            io.to(makeRoomId(roomId)).emit('chatMsg', {username: username, message: msg});
        } catch {
            socket.emit("server-error", {message: "msg is not sent because of server error."});
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
            await chatRoomModel.leave({username: username});
            io.to(makeRoomId(roomId)).emit("leave", {username: username});
        } catch {
            socket.emit("server-error", {message: "user is not left because of server error"});
        }
    })
}