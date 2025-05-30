const express = require('express');
const { registrationAndLogin } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/auth/login', registrationAndLogin);

module.exports = router;
