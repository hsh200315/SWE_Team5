const request = require('supertest');
const app = require("../../app");
const initInMemoryDb = require('../utils/initDB');
const { testAPIURL } = require('../utils/constants');


beforeAll(async() => {
    await initInMemoryDb();
});



describe('Auth API', () => {
  // 1) 유저 아이디 누락 시 400
  test(`POST ${testAPIURL}/auth/login without userId → 400`, async () => {
    const res = await request(app)
      .post(`${testAPIURL}/auth/login`)
      .send({});
    expect(res.statusCode).toBe(400);
    
  });

  // 2) 정상적으로 로그인/registration 되는 경우
  test(`POST ${testAPIURL}/auth/login with new userId → 200`, async () => {
    const res = await request(app)
      .post(`${testAPIURL}/auth/login`)
      .send({ username: 'alice' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({ username: 'alice'});
    expect(res.body.message).toEqual("Success Login.");
  });

});