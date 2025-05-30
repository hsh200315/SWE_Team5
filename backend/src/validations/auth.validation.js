const { check } = require("express-validator");

const login = [
    check('username', 'Username cannot be empty').not().isEmpty()
]

module.exports = {
    login
}