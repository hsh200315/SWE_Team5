BEGIN TRANSACTION;

-- 1) Users
INSERT INTO User (user_id) VALUES ('alice');
INSERT INTO User (user_id) VALUES ('bob');
INSERT INTO User (user_id) VALUES ('charlie');

-- 2) ChatRooms
INSERT INTO ChatRoom (room_name, owner_id) VALUES ('General', 'alice');
INSERT INTO ChatRoom (room_name, owner_id) VALUES ('Random',  'bob');

-- 3) ChatRoomUser (맴버 매핑)
-- General 방: alice, bob
INSERT INTO ChatRoomUser (room_id, user_id) VALUES (1, 'alice');
INSERT INTO ChatRoomUser (room_id, user_id) VALUES (1, 'bob');
-- Random 방: bob, charlie
INSERT INTO ChatRoomUser (room_id, user_id) VALUES (2, 'bob');
INSERT INTO ChatRoomUser (room_id, user_id) VALUES (2, 'charlie');

-- 4) Chats (map_image, is_from_AI 를 NULL 로 지정)
-- General 방 대화
INSERT INTO Chat (room_id, sender_id, message, is_from_AI, map_image)
VALUES (1, 'alice',   '안녕하세요, 모두!',        NULL, NULL);
INSERT INTO Chat (room_id, sender_id, message, is_from_AI, map_image)
VALUES (1, 'bob',     '반가워요, alice!',       NULL, NULL);
-- Random 방 대화
INSERT INTO Chat (room_id, sender_id, message, is_from_AI, map_image)
VALUES (2, 'bob',     'Random 채팅입니다.',      NULL, NULL);
INSERT INTO Chat (room_id, sender_id, message, is_from_AI, map_image)
VALUES (2, 'charlie', '좋은 하루 보내세요!',      NULL, NULL);

COMMIT;