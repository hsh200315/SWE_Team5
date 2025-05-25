const { register } = require("../../models/auth.model");
// user: alice, bob, charlie를 만든다.
async function initUsers(usernames) {
    usernames.forEach(async (username) => {
        await register({username: username});
    })
}

module.exports = {
    initUsers: initUsers
}