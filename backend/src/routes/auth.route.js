const express = require('express');
const { API_URL } = require('../helpers/env');
const { login } = require('../validations/auth.validation');

const router = express.Router();

router.post(API_URL+'/auth/login', login, loginAccount);
