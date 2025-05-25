const express = require('express');
const { createRoom, getUserList, getRoomList } = require('../controllers/chatRoom.controller');

const router = express.Router();

router
    .post('/rooms', createRoom)
    .get('/rooms', getRoomList)
    .get('/rooms/:id/users', getUserList)


module.exports = router;