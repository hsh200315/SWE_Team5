const express = require('express');
const { promptGeneration, questionParsing } = require('../controllers/AI.controller');

const router = express.Router();

router.post('/ai/prompt-generation', promptGeneration);
//router.post('/ai/ai-test', questionParsing);
module.exports = router;
