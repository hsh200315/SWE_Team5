
const { register, findById } = require("../../models/auth.model");
const initInMemoryDb = require("../utils/initDB");
let db;
beforeAll(async () => {
    db = await initInMemoryDb();
});
  
afterAll(async () => {
    await db.close();
});

describe('User table test', () => {
    test('Insert User and check to insert', async() => {
        const username = 'alice';
        await register({username: username});
        const user = await findById({username: username});
        expect(user.user_id).toBe(username);
    });

    test('Find not existed User', async () => {
        const username='bob';
        const user = await findById({username: username});
        expect(user).toBeUndefined();
    });

    }
)