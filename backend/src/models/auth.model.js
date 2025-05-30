const { run, get } = require("../config/db");

module.exports = {
    // 사용자 등록 함수
    register: async (data) => {
        const { username } = data;
        
        try {
            // 주어진 username을 user_id로 삽입
            const result = await run('INSERT INTO User(user_id) VALUES(?)', username);
            return result;
        } catch(err) {
            return new Error(err);
        }
    },
    // 사용자 조회 함수
    findById: async (data) => {
        const { username } = data;

        try {
            // username에 해당하는 사용자 조회, 존재하지 않으면 null 반환
            const result = await get("SELECT * FROM User WHERE user_id=?", [username]);
            return result;
        } catch(err) {
            return new Error(err);
        }
    }
}