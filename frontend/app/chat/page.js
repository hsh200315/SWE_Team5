"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import ReactModal from "react-modal";
import {
  GoPaperAirplane,
  GoSearch,
  GoCheckCircle,
  GoCpu,
  GoPencil,
  GoFile,
} from "react-icons/go";
import { AiOutlineFilter } from "react-icons/ai";

import Sidebar from "../components/Sidebar";

export default function ChatRoom() {
  const router = useRouter();

  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const [username, setUsername] = useState("");
  const [chatList, setChatList] = useState([]);
  const [modalChatList, setModalChatList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [selectedRoomUsers, setSelectedRoomUsers] = useState([]);

  const [buttonOnOff, setButtonOnOff] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [modalOnOff, setModalOnOff] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);

  // 1) 컴포넌트 마운트 시 sessionStorage에서 username 읽어오기
  useEffect(() => {
    const storedUser = sessionStorage.getItem("username");
    if (typeof window !== "undefined") {
      ReactModal.setAppElement("body");
      if (storedUser) setUsername(storedUser);
    }
    if (!storedUser) {
      router.push("/login");
      alert("로그인이 필요합니다.");
      return;
    }
  }, []);

  // 2) username이 세팅되면 방 목록 요청
  useEffect(() => {
    if (!username) return;
    fetchRoomList();
  }, [username]);

  // 3) selectedRoom이 바뀔 때마다 소켓 재연결 및 기존 채팅 불러오기
  useEffect(() => {
    setCheckedIds([]);
    setButtonOnOff([false, false, false, false, false]);

    if (selectedRoom === 0) return;
    fetchChatHistory();
    fetchRoomUsers();
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    socketRef.current = io("http://localhost:4000", {
      auth: { username, roomId: selectedRoom },
    });

    socketRef.current.on("chatMsg", (data) => {
      setChatList((prev) => [
        ...prev,
        { sender_id: data.sender_id, message: data.message },
      ]);
      if (chatRef.current) {
        chatRef.current.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedRoom]);

  useEffect(() => {
    setModalChatList(chatList);
    if (modalOnOff) {
      setCheckedIds([]);}
    console.log(modalOnOff, checkedIds)
  }, [modalOnOff]);

  // 4) 방 목록을 가져오는 함수
  const fetchRoomList = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/roomlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) setRoomList([...data.data].reverse());
      else console.error("방 목록 불러오기 실패:", data);
    } catch (err) {
      console.error("방 목록 요청 중 에러:", err);
    }
  };

  // 5) 선택된 방의 채팅 내역을 가져오는 함수
  const fetchChatHistory = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/rooms/${selectedRoom}/messages`,
        { method: "GET" }
      );
      const data = await res.json();
      if (res.ok) {
        setChatList([...data.data].reverse());

        setTimeout(() => {
          if (chatRef.current) {
            chatRef.current.scrollTo({
              top: chatRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 50);
      } else {
        console.error("채팅 내역 불러오기 실패:", data);
      }
    } catch (err) {
      console.error("채팅 내역 요청 중 에러:", err);
    }
  };

  // 6) 채팅 메시지를 전송하는 함수
  const sendChat = () => {
    if (!socketRef.current) return;

    const text = inputRef.current.value.trim();
    if (!text) return;

    const chatData = {
      msg: text,
      toAI: buttonOnOff[0],
      chatHistory: [],
    };

    socketRef.current.emit("chatMsg", chatData);
    inputRef.current.value = "";
  };

  // 7) 선택한 채팅방의 유저 정보를 가져오는 함수
  const fetchRoomUsers = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/rooms/${selectedRoom}/users`,
        { method: "GET" }
      );
      const data = await res.json();
      if (res.ok) {
        setSelectedRoomUsers(data.data);
      } else {
        console.error("방 유저 정보 불러오기 실패:", data);
      }
    } catch (err) {
      console.error("방 유저 정보 요청 중 에러:", err);
    }
  };

  return (
    <div className="flex h-screen">
      {/*======= 모달창 =======*/}
      <CheckModal
        modalOnOff={modalOnOff}
        SetModalOnOff={setModalOnOff}
        checkedIds={checkedIds}
        setCheckedIds={setCheckedIds}
        modalChatList={modalChatList}
        username={username}
      />

      {/*======= 사이드바 (방 목록) =======*/}
      <div className="h-full w-1/7">
        <Sidebar
          roomList={roomList}
          SetRoomList={setRoomList}
          selectedRoom={selectedRoom}
          SetSelectedRoom={setSelectedRoom}
          selectedRoomUsers={selectedRoomUsers}
          username={username}
        />
      </div>

      {/*======= 채팅창 영역 =======*/}
      <main className="flex-1 bg-white pt-[7vh] pb-[20vh] px-[15vw] w-6/7">
        {selectedRoom === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-3xl">
            채팅방을 선택하거나, 새로운 채팅방을 만드세요!
          </div>
        ) : (
          <div
            ref={chatRef}
            className="space-y-2 w-full h-full overflow-y-auto pb-[20vh]"
          >
            {chatList.map((chat, idx) =>
              chat.sender_id === username ? (
                <ChatBubbleMine key={idx}>{chat.message}</ChatBubbleMine>
              ) : (
                <ChatBubbleOther key={idx} name={chat.sender_id}>
                  {chat.message}
                </ChatBubbleOther>
              )
            )}
          </div>
        )}

        {/* 하단 입력창 + 전송 버튼 */}
        <div className="absolute bottom-0 left-[29vw] right-[15vw] bg-white p-2 mb-[2vh] border rounded-[22px]">
          <textarea
            ref={inputRef}
            rows={1}
            style={{ maxHeight: "4.5rem" }}
            placeholder="메시지를 입력하세요"
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(
                e.target.scrollHeight,
                72
              )}px`;
            }}
            disabled={selectedRoom === 0}
            className={`w-full resize-none overflow-y-auto p-2 rounded shadow-none focus:outline-none border-none ${
              selectedRoom === 0 ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
          <div className="flex justify-between items-center">
            <div
              className={
                selectedRoom === 0 ? "opacity-50 pointer-events-none" : ""
              }
            >
              <ButtonList
                SetButtonOnOff={setButtonOnOff}
                buttonOnOff={buttonOnOff}
                SetModalOnOff={setModalOnOff}
                checkedIds={checkedIds}
                setCheckedIds={setCheckedIds}
              />
            </div>
            <button
              onClick={sendChat}
              disabled={selectedRoom === 0}
              style={{ backgroundColor: "#11B8FF" }}
              className={`p-2 rounded-2xl shadow text-white hover:bg-blue-600 ${
                selectedRoom === 0
                  ? "opacity-50 cursor-not-allowed hover:bg-blue-600"
                  : ""
              }`}
            >
              <GoPaperAirplane className="text-base" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/*======== 채팅 버블 (Other) ========*/
function ChatBubbleOther({ name, children }) {
  return (
    <div className="flex flex-col items-start mb-2">
      <div className="text-sm font-semibold ml-2">{name}</div>
      <div className="bg-sky-300 px-4 py-2 rounded-lg max-w-[70%] break-words ml-2">
        {children}
      </div>
    </div>
  );
}

/*======== 채팅 버블 (Mine) ========*/
function ChatBubbleMine({ children }) {
  return (
    <div className="flex flex-col items-end mb-2">
      <div className="bg-sky-100 text-black px-4 py-2 rounded-2xl max-w-[70%] break-words text-left mr-2">
        {children}
      </div>
    </div>
  );
}

/*======== 모달채팅 버블 (Other) ========*/
function ModalChatBubbleOther({ name, children, toggleCheck, checkedIds, chat }) {
  return (
    <div className="flex flex-col items-start mb-2">
      <div className="text-sm font-semibold ml-2">{name}</div>
      <div className="flex flex-row">
        <div className="bg-sky-300 px-4 py-2 rounded-lg max-w-[100%] break-words ml-2">
          {children}
        </div>
        <button
          onClick={() => toggleCheck(chat.chat_id)}
          className="ml-2 mt-3"
        >
          <GoCheckCircle
            className={`text-xl ${
              checkedIds.includes(chat.chat_id) ? "text-green-500" : "text-gray-300"
            }`}
          />
        </button>
      </div>
      
    </div>
  );
}

/*======== 모달채팅 버블 (Mine) ========*/
function ModalChatBubbleMine({ children, toggleCheck, checkedIds, chat }) {
  return (
    <div className="flex flex-row justify-end mb-2 w-[100%]">
      <button
        onClick={() => toggleCheck(chat.chat_id)}
        className="mb-2 mr-2"
      >
        <GoCheckCircle
          className={`text-xl ${
            checkedIds.includes(chat.chat_id) ? "text-green-500" : "text-gray-300"
          }`}
        />
      </button>
      <div className="bg-sky-100 text-black px-4 py-2 rounded-2xl max-w-[70%] break-words text-left mr-2">
        {children}
      </div>
    </div>
  );
}

/*======== 버튼 목록 (좌측 하단 기능) ========*/
function ButtonList({
  SetButtonOnOff,
  buttonOnOff,
  SetModalOnOff,
  checkedIds,
  setCheckedIds,
}) {
  const buttonTitle = [
    "AI에게 물어보기",
    "프롬프트 추천",
    "일정표 형식 답변 생성",
    "대화 내역 검색",
  ];

  return (
    <div className="flex justify-center">
      <div className="flex space-x-2">
        {[0, 1, 2].map((idx) => {
          const label = buttonTitle[idx];
          return (
            <button
              key={idx}
              onClick={() =>
                SetButtonOnOff((prev) => {
                  const copy = [...prev];
                  copy[idx] = !copy[idx];
                  return copy;
                })
              }
              style={{ borderColor: "#D4D4D4" }}
              className={`px-3 py-1 rounded-full border text-sm ${
                buttonOnOff[idx] ? "bg-sky-400" : "bg-white"
              }`}
            >
              <div
                className="flex items-center space-x-1"
                style={{ color: buttonOnOff[idx] ? "white" : "#8F8F8F" }}
              >
                {idx === 0 && <GoCpu className="text-base" />}
                {idx === 1 && <GoPencil className="text-base" />}
                {idx === 2 && <GoFile className="text-base" />}
                <span>{label}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex space-x-2">
        <button
          key={3}
          onClick={() => SetModalOnOff((prev) => !prev)}
          style={{ borderColor: "#D4D4D4" }}
          className={`px-3 py-1 rounded-full border text-sm ${
            buttonOnOff[3] ? "bg-sky-400" : "bg-white"
          }`}
        >
          <div
            className="flex items-center space-x-1"
            style={{ color: buttonOnOff[3] ? "white" : "#8F8F8F" }}
          >
            <GoSearch className="text-base" />
            <span>{buttonTitle[3]}</span>
          </div>
        </button>
      </div>
      <div className="flex items-center justify-center">
        <button
          style={{
            color: checkedIds.length !== 0 ? "#ffffff" : "#8F8F8F",
            borderColor: checkedIds.length !== 0 ? "#4ade80" : "#D4D4D4",
            backgroundColor: checkedIds.length !== 0 ? "#4ade80" : "#ffffff",
          }}
          className="ml-[0.5rem] rounded-full border text-3xl transition-colors duration-200 border-none"
        >
          <GoCheckCircle />
        </button>
      </div>
    </div>
  );
}

/*======== 채팅 검색 모달창 ========*/
function CheckModal({
  modalOnOff,
  SetModalOnOff,
  checkedIds,
  setCheckedIds,
  modalChatList,
  username,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCheck = (id) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const onClickToggle = () => {
    SetModalOnOff(false);
  };

  return (
    <ReactModal
      isOpen={modalOnOff}
      onRequestClose={() => SetModalOnOff(false)}
      ariaHideApp={false}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 50,
        },
        content: {
          top: "20%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          transform: "translate(-50%, 0)",
          width: "50vw",
          height: "60vh",
          padding: "1rem",
          borderRadius: "1rem",
          border: "1px solid #ccc",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2 mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="채팅 검색..."
          className="flex-grow px-3 py-2 border-none rounded-md text-sm mr-2"
        />
        <button
          onClick={() => SetModalOnOff(false)}
          className="text-gray-500 hover:text-black text-3xl font-bold"
        >
          &times;
        </button>
      </div>

      {/* Top Right Toggle */}
      <div className="flex justify-end w-full h-[8%] mb-3">
        <button className="flex items-center px-2 py-1 bg-white border border-gray-300 rounded-l-md">
          <AiOutlineFilter className="text-xl text-gray-500" />
        </button>
        <select className="border border-gray-300 border-l-0 rounded-r-md px-2 py-1">
          <option>Both</option>
          <option>Checked</option>
          <option>Unchecked</option>
        </select>
      </div>

      {/* Chat Content Area*/}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-3 space-y-2 rounded h-[40%] mb-16">
        {modalChatList
          .filter((chat) =>
            chat.message.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((chat, idx) =>
            chat.sender_id === username ? (
              <div className="flex justify-end mb-2 items-center" key={idx}>
                <ModalChatBubbleMine toggleCheck={toggleCheck} checkedIds={checkedIds} chat={chat}>{chat.message}</ModalChatBubbleMine>
              </div>
            ) : (
              <div className="flex justify-start mb-2 items-center" key={idx}>
                <ModalChatBubbleOther key={idx} name={chat.sender_id} toggleCheck={toggleCheck} checkedIds={checkedIds} chat={chat}>
                  {chat.message}
                </ModalChatBubbleOther>
              </div>
            )
          )}
      </div>

      {/* Footer Button */}
      <button
        onClick={onClickToggle}
        className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg"
      >
        <GoCheckCircle className="text-lg" />
        <span>선택한 채팅 내역 지문에 포함</span>
      </button>
    </ReactModal>
  );
}
