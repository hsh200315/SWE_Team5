const { run, get } = require("../config/db");

module.exports = {
    register: async (data) => {
        const { username } = data;
        
        try {
            const result = await run('INSERT INTO User(user_id) VALUES(?)', username);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    findById: async (data) => {
        const { username } = data;

        try {
            const result = await get("SELECT * FROM User WHERE user_id=?", [username]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    }
}