const { get } = require("../config/db");
const { register, findById } = require("../models/auth.model");
const initInMemoryDb = require("./utils/initailize");
let db;
beforeAll(async () => {
    db = await initInMemoryDb();
});
  
afterAll(async () => {
    await db.close();
});

// describe('Chat Test',
//     test('')
// )

// 1. 채팅이 올바르게 추가되는지

// 2. chat들이 시간 내림차순으로 잘 가져와지는지
describe('User table test', () => {
    test('init', async() => {
        expect(0).toBe(0);
    })
}
)
