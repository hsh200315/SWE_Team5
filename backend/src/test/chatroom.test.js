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

// 1. chatroom이 정상적으로 만들어지는지

// 2. user list가 정상적으로 가져와지는지

// 3. room list가 정상적으로 가져와지는지

// 4. invite가 정상적으로 되는지

// 5. user가 leave가 잘 되는지

// 6. username와 roomId에 따른 데이터가 잘 찾아지는지
describe('User table test', () => {
    test('init', async() => {
        expect(0).toBe(0);
    })
}
)