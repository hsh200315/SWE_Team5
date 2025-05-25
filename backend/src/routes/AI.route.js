const express = require('express');
const { API_URL } = require('../helpers/env');
const { promptGeneration } = require('../controllers/AI.controller');

const router = express.Router();

//router.post('/auth/login', registrationAndLogin);
router.post('/ai/prompt-generation', promptGeneration);

module.exports = router;
