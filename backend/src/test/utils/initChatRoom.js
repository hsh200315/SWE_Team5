const { invite, create, userlist } = require("../../models/chatRoom.model")

async function inviteUsers(roomId, usernames) {
    usernames.forEach(async (username) => {
        await invite({username: username, roomId: roomId});
    })
};
async function makeRoom(username, roomname) {
    const room = await create({username: username, roomname: roomname});
    return room;
}
async function getUserlist(roomId) {
    const result = await userlist({roomId: roomId});
    return result;
}


module.exports = {
    inviteUsers: inviteUsers,
    makeRoom: makeRoom,
    getUserlist: getUserlist
}