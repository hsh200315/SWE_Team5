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

// 1. user가 제대로 생성되는지

// 2. 없는 user에 대해서 올바른 값을 반환하는지

// 3. 같은 username을 여러번 넣으려고 하면 에러가 발생하는지
describe('User table test', () => {
    test('Insert User', async() => {
        const username = 'alice';
        // 1. alice user를 넣는다.
        await register({username: username});
        // 2. alice user가 존재하는지 확인한다.
        const user = await findById({username: username});
        expect(user.user_id).toBe(username);
    });

    test('Find not existed User', async () => {
        const username='bob';
        const user = await findById({username: username});
        expect(user).toBeUndefined();
    });

    test('Insert same user', async() => {
        const username = 'bob';
        // 1. alice user를 넣는다.
        await register({username: username});
        await expect(register({username: username})).rejects.toThrow();
    })
}
)