const { invite } = require("../../models/chatRoom.model")

async function inviteUsers(roomId, usernames) {
    usernames.forEach(async (username) => {
        await invite({username: username, roomId: roomId});
    })
}

module.exports = {
    inviteUsers: inviteUsers
}