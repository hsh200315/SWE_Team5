const { get } = require("../config/db");
const initInMemoryDb = require("./utils/initailize");
let db;
beforeAll(async () => {
    db = await initInMemoryDb();
});
  
afterAll(async () => {
    await db.close();
});

test('table 생성 및 비어 있는지 확인', async () => {
    const rowUser = await get(`SELECT count(*) AS cnt FROM User`);
    expect(rowUser.cnt).toBe(0);
    const rowChatroom = await get(`SELECT count(*) AS cnt FROM Chat`);
    expect(rowChatroom.cnt).toBe(0);
    const rowChat = await get(`SELECT count(*) AS cnt FROM Chat`);
    expect(rowChat.cnt).toBe(0);
    const rowChatRoomUser = await get(`SELECT count(*) AS cnt FROM ChatRoomUser`);
    expect(rowChatRoomUser.cnt).toBe(0);
    
});