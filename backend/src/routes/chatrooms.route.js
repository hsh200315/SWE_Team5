const express = require('express');
const { createRoom, getUserList, getRoomList } = require('../controllers/chatRoom.controller');
const { getChatList } = require('../controllers/chat.controller');

const router = express.Router();

router
    .post('/rooms', createRoom)
    .post('/roomlist', getRoomList)
    .get('/rooms/:id/users', getUserList)
    .get('/rooms/:id/messages', getChatList);

module.exports = router;