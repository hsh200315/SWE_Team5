const { SECRET_KEY, BRAVE_API_KEY } = require('../config/env');
const axios = require('axios');
const crypto = require('crypto');
function makeRoomId(roomId) {
    return `room-${roomId}`;
}

// 메시지 암호화
function encryptMessage(plaintext) {
    if(!plaintext || plaintext == '') return '';
    const key = Buffer.from(SECRET_KEY, 'base64');
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}
// 메시지 복호화
function decryptMessage(ciphertext) {
    if(!ciphertext || ciphertext == '') return '';
    const key = Buffer.from(SECRET_KEY, 'base64'); 
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function getSearchResult(search){
    
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
    },
    params: { q: search, count: 5 }
    });
    return JSON.stringify(res.data, null, 2);

}


module.exports = {
    makeRoomId,
    encryptMessage,
    decryptMessage,
    getSearchResult
};