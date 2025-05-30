const express = require('express');
const { API_URL } = require('../helpers/env');
const { login } = require('../validations/auth.validation');
const { registrationAndLogin } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/auth/login', registrationAndLogin);

module.exports = router;
