const { success, failed } = require('../utils/response');
const authModel = require('../models/auth.model');

module.exports = {
    registrationAndLogin: async (req, res) => {
        try {
            const {username} = req.body;

            // username이 비어있으면 400 오류 응답
            if(!username) {
                return failed(res, {
                    code: 400,
                    message: 'BAD REQUEST',
                    error: 'username required.'
                });
            };
            // 기존 사용자 확인
            const result = await authModel.findById({username: username});
            // 존재하지 않으면 자동으로 회원가입 처리
            if(!result) {
                await authModel.register({username: username});
            }
            // 성공 응답 반환
            return success(res, {
                code: 200,
                message: "Success Login.",
                data: {username: username}
            });
        } catch (err) {
            return failed(res, {
                code: 500,
                message: err.message,
                error: 'Internal Server Error'
            });
        }
    }
}