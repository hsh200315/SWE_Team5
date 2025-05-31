const request = require('supertest');
const app = require("../../app");
const initInMemoryDb = require('../utils/initDB');
const { testAPIURL } = require('../utils/constants');
const { initUsers } = require('../utils/initUser');
const { run } = require('../../config/db');
const { sleep } = require('../utils/timeUtils');

const usernames = ['alice'];
beforeAll(async() => {
    await initInMemoryDb();
    await initUsers(usernames);
});

beforeEach(async () => {
    await run('DELETE FROM ChatRoomUser');
    await run('DELETE FROM ChatRoom');
});



describe('chatroom API', () => {
  // 1) roomname 누락시 400
  test(`POST ${testAPIURL}/rooms without username → 400`, async () => {
    const res = await request(app)
      .post(`${testAPIURL}/rooms`)
      .send({userlist:[]});
    expect(res.statusCode).toBe(400);
    
    expect(res.body.error).toEqual('userlist and roomname required.');
  });

  // 2) 존재하지 않는 user가 방을 만들려고 할 시 failUserlist 값 확인
  test(`POST ${testAPIURL}/rooms unexisted user → 404`, async () => {
    const unexistedUser = 'bob';
    const roomname = 'testroom';
    const res = await request(app)
      .post(`${testAPIURL}/rooms`)
      .send({userlist: [unexistedUser], roomname:roomname});
    expect(res.statusCode).toBe(201);

    expect(res.body.data.roomname).toEqual(roomname);
    expect(res.body.data.updated_at).toBeDefined();
    expect(res.body.data.successUserlist).toEqual([]);
    expect(res.body.data.failUserlist).toEqual([unexistedUser]);
  });
  // 4) 존재하는 user가 방을 만드는 경우 -> 201
  test(`POST ${testAPIURL}/rooms existed user → 201`, async () => {
    const username = usernames[0];
    const roomname = "testroom";
    const res = await request(app)
      .post(`${testAPIURL}/rooms`)
      .send({userlist: [username], roomname:roomname});
    expect(res.statusCode).toBe(201);
    expect(res.body.data.roomId).toEqual(2);
    expect(res.body.data.roomname).toEqual(roomname);
    expect(res.body.data.updated_at).toBeDefined();

    expect(res.body.data.successUserlist).toEqual([username]);
    expect(res.body.data.failUserlist).toEqual([]);
  });

  // 5) username이 비어있는 경우
  test(`GET ${testAPIURL}/rooms without username → 400`, async () => {
    const res = await request(app)
      .post(`${testAPIURL}/roomlist`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toEqual('username required.');
  });

  // 6) 존재하는 않는 User가 자신이 속한 방을 가지고 오려하는 경우 -> 404
  test(`GET ${testAPIURL}/rooms not existed user → 404`, async () => {
    const unexistedUser = 'nouser';
    const res = await request(app)
      .post(`${testAPIURL}/roomlist`)
      .send({username: unexistedUser});
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toEqual('USER NOT FOUND');
  });

  // 7) 존재하는 user가 자신이 속한 방을 가지고 오려하는 경우 -> 201
  test(`GET ${testAPIURL}/rooms exist user → 404`, async () => {
    const username = usernames[0];
    const roomnames = ["firstRoom", "secondRoom"];

    // room을 생성한다.
    await request(app)
        .post(`${testAPIURL}/rooms`)
        .send({userlist: [username], roomname:roomnames[0]});
    await sleep(1000);
    await request(app)
        .post(`${testAPIURL}/rooms`)
        .send({userlist: [username], roomname:roomnames[1]});

    // roomlist를 가져온다.
    const res = await request(app).post(`${testAPIURL}/roomlist`).send({username: 'alice'});
    expect(res.body.data.length).toBe(2);
    
  });
  // 8) 존재하지 않는 roomId를 가져오려는 경우
  test(`GET ${testAPIURL}/rooms/:id/users -> 200`, async() => {
    const username = usernames[0];
    const notExistedRoomID = 10;
    const res = await request(app)
        .get(`${testAPIURL}/rooms/${notExistedRoomID}/users`).send({});
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("ROOM NOT FOUND");
   
  });
  // 9) roomId에 속한 user를 가져오는 경우
  test(`GET ${testAPIURL}/rooms/:id/users -> 200`, async() => {
    const username = usernames[0];
    const roomname = "firstRoom";

    // room을 생성한다.
    const res1 = await request(app)
        .post(`${testAPIURL}/rooms`)
        .send({userlist: [username], roomname:roomname});
    const roomId = res1.body.data.roomId;

    const res = await request(app)
        .get(`${testAPIURL}/rooms/${roomId}/users`).send({});
    
    const users = res.body.data;
    expect(users.length).toBe(1);
    expect(users[0].user_id).toBe(username);
  });
});