const { SECRET_KEY } = require('../helpers/env');
const crypto = require('crypto');
function makeRoomId(roomId) {
    return `room-${roomId}`;
}


function encryptMessage(plaintext) {
    if(!plaintext || plaintext == '') return '';
    const key = Buffer.from(SECRET_KEY, 'base64');
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}
function decryptMessage(ciphertext) {
    if(!ciphertext || ciphertext == '') return '';
    const key = Buffer.from(SECRET_KEY, 'base64'); 
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    makeRoomId,
    encryptMessage,
    decryptMessage
};