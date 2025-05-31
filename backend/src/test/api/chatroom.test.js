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
    // usernames 미리 등록
    await initUsers(usernames);
});

beforeEach(async () => {
    // 테스트를 진행할 때마다 데이터베이스 초기화
    await run('DELETE FROM ChatRoomUser');
    await run('DELETE FROM ChatRoom');
});



describe('chatroom API', () => {
  // 1) 필수 필드 누락시 400
  test(`POST ${testAPIURL}/rooms without username → 400`, async () => {
    const reswithoutRoomname = await request(app)
      .post(`${testAPIURL}/rooms`)
      .send({userlist:[]});

      const reswithoutUserlist = await request(app)
      .post(`${testAPIURL}/rooms`)
      .send({rooname:"testroom"});

    
    expect(reswithoutRoomname.statusCode).toBe(400);
    expect(reswithoutRoomname.body.error).toEqual('userlist and roomname required.');

    expect(reswithoutUserlist.statusCode).toBe(400);
    expect(reswithoutUserlist.body.error).toEqual('userlist and roomname required.');

  });

  // 2) 존재하지 않는 user가 방을 만들려고 할 시 failUserlist 값 확인
  test(`POST ${testAPIURL}/rooms unexisted user`, async () => {
    const unexistedUser = 'bob';
    const roomname = 'testroom';
    const res = await request(app)
      .post(`${testAPIURL}/rooms`)
      .send({userlist: [unexistedUser], roomname:roomname});
    expect(res.statusCode).toBe(201);

    expect(res.body.data.room_name).toEqual(roomname);
    expect(res.body.data.updated_at).toBeDefined();
    expect(res.body.data.successUserlist).toEqual([]);
    expect(res.body.data.failUserlist).toEqual([unexistedUser]);
  });
  // 4) 존재하는 user가 방을 만드는 경우 -> 201
  test(`POST ${testAPIURL}/rooms existed user`, async () => {
    const username = usernames[0];
    const roomname = "testroom";
    const res = await request(app)
      .post(`${testAPIURL}/rooms`)
      .send({userlist: [username], roomname:roomname});
    expect(res.statusCode).toBe(201);
    expect(res.body.data.room_id).toEqual(2);
    expect(res.body.data.room_name).toEqual(roomname);
    expect(res.body.data.updated_at).toBeDefined();

    expect(res.body.data.successUserlist).toEqual([username]);
    expect(res.body.data.failUserlist).toEqual([]);
  });

  // 5) 
  test(`GET ${testAPIURL}/roomlist without username → 400`, async () => {
    const res = await request(app)
      .post(`${testAPIURL}/roomlist`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toEqual('username required.');
  });

  // 6) 존재하는 않는 User가 자신이 속한 방을 가지고 오려하는 경우 -> 404
  test(`GET ${testAPIURL}/roomlist not existed user → 404`, async () => {
    const unexistedUser = 'nouser';
    const res = await request(app)
      .post(`${testAPIURL}/roomlist`)
      .send({username: unexistedUser});
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toEqual('USER NOT FOUND');
  });

  // 7) 존재하는 user가 자신이 속한 방을 가지고 오려하는 경우 -> 201
  test(`GET ${testAPIURL}/roomlist exist user → 201`, async () => {
    const username = usernames[0];
    const roomnames = ["firstRoom", "secondRoom"];

    // room을 생성한다.
    await request(app)
        .post(`${testAPIURL}/rooms`)
        .send({userlist: [username], roomname:roomnames[0]});
    await request(app)
        .post(`${testAPIURL}/rooms`)
        .send({userlist: [username], roomname:roomnames[1]});

    const res = await request(app).post(`${testAPIURL}/roomlist`).send({username: 'alice'});

    expect(res.body.data.length).toBe(2);
    
  });
  // 8) 존재하지 않는 roomId를 가져오려는 경우
  test(`GET ${testAPIURL}/rooms/:id/users -> 200`, async() => {
    const notExistedRoomID = 100;
    const res = await request(app)
        .get(`${testAPIURL}/rooms/${notExistedRoomID}/users`).send({});
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("ROOM NOT FOUND");
   
  });
  // 9) roomId에 속한 user를 가져오는 경우
  test(`GET ${testAPIURL}/rooms/:id/users -> 200`, async() => {
    const username = usernames[0];
    const roomname = "firstRoom";

    // room을 생성하고 username을 넣는다.
    const res1 = await request(app)
        .post(`${testAPIURL}/rooms`)
        .send({userlist: [username], roomname:roomname});
    const roomId = res1.body.data.room_id;

    const res = await request(app)
        .get(`${testAPIURL}/rooms/${roomId}/users`).send({});
    
    const users = res.body.data;
    expect(users.length).toBe(1);
    expect(users[0].user_id).toBe(username);
  });
});