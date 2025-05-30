const { success, failed } = require('../utils/response');
const authModel = require('../models/auth.model');

module.exports = {
    registrationAndLogin: async (req, res) => {
        try {
            const {username} = req.body;
            if(!username) {
                return failed(res, {
                    code: 400,
                    message: 'BAD REQUEST',
                    error: 'username required.'
                });
            };
            const result = await authModel.findById({username: username});
            if(!result) {
                await authModel.register({username: username});
            }
            return success(res, {
                code: 200,
                message: "Success Login.",
                data: {username: username}
            });
        } catch (error) {
            return failed(res, {
                code: 500,
                message: error.message,
                error: 'Internal Server Error'
            });
        }
    }
}