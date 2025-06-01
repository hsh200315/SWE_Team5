"use client";

import { useState, useEffect, useRef } from "react";
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

import Sidebar from "../components/Sidebar";

export default function ChatRoom() {
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const [username, setUsername] = useState("");
  const [chatList, setChatList] = useState([]);
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
  const [chatChecked, setChatChecked] = useState(false);

  // 1) 컴포넌트 마운트 시 sessionStorage에서 username 읽어오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      ReactModal.setAppElement("body");
      const storedUser = sessionStorage.getItem("username");
      if (storedUser) setUsername(storedUser);
    }
  }, []);

  // 2) username이 세팅되면 방 목록 요청
  useEffect(() => {
    if (!username) return;
    fetchRoomList();
  }, [username]);

  // 3) selectedRoom이 바뀔 때마다 소켓 재연결 및 기존 채팅 불러오기
  useEffect(() => {
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
        chatChecked={chatChecked}
        SetChatChecked={setChatChecked}
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
        {/* 메시지 리스트 */}
        <div ref={chatRef} className="space-y-2 w-full h-full overflow-y-auto">
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
            className="w-full resize-none overflow-y-auto p-2 rounded shadow-none focus:outline-none border-none"
          />
          <div className="flex justify-between items-center">
            <ButtonList
              SetButtonOnOff={setButtonOnOff}
              buttonOnOff={buttonOnOff}
              SetModalOnOff={setModalOnOff}
              chatChecked={chatChecked}
              setChatChecked={setChatChecked}
            />
            <button
              onClick={sendChat}
              style={{ backgroundColor: "#11B8FF" }}
              className="p-2 rounded-2xl shadow text-white hover:bg-blue-600"
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
    <div className="text-black w-fit max-w-[70%]">
      <div className="text-sm font-semibold">{name}</div>
      <div className="bg-sky-300 px-4 py-2 rounded-lg">{children}</div>
    </div>
  );
}

/*======== 채팅 버블 (Mine) ========*/
function ChatBubbleMine({ children }) {
  return (
    <div className="flex justify-end mb-2">
      <div className="bg-sky-100 text-black px-4 py-2 rounded-2xl w-fit max-w-[70%] text-left">
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
  chatChecked,
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
            color: chatChecked ? "#ffffff" : "#8F8F8F",
            borderColor: chatChecked ? "#4ade80" : "#D4D4D4",
            backgroundColor: chatChecked ? "#4ade80" : "#ffffff",
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
  chatChecked,
  SetChatChecked,
}) {
  const onClickToggle = () => {
    SetChatChecked((prev) => !prev);
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
      <div className="flex justify-end w-full h-[5%] mb-3">
        <select className="border w-[20%]">
          <option>Both</option>
          <option>Checked</option>
          <option>Unchecked</option>
        </select>
      </div>

      {/* Chat Content Area (예시) */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-3 space-y-2 rounded">
        <ChatBubbleMine>예시 메시지</ChatBubbleMine>
        <ChatBubbleOther name="사용자">다른 사용자 메시지</ChatBubbleOther>
      </div>

      {/* Footer Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClickToggle}
          className="bg-green-500 text-white px-4 py-2 rounded-full text-sm shadow hover:bg-green-600"
        >
          선택된 채팅 내역 질문에 포함
        </button>
      </div>
    </ReactModal>
  );
}
