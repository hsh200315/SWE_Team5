"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { LoadScriptNext, GoogleMap, MarkerF} from "@react-google-maps/api";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReactModal from "react-modal";
import logo_white from "../../public/logo_white.png";
import {
  GoPaperAirplane,
  GoSearch,
  GoCheckCircle,
  GoCpu,
  GoPencil,
  GoFile,
} from "react-icons/go";
import { AiOutlineFilter } from "react-icons/ai";
import { LuLoader } from "react-icons/lu";
import { CiEdit } from "react-icons/ci";

import Sidebar from "../components/Sidebar";

export default function ChatRoom() {
  const router = useRouter();

  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const promptRef = useRef(null);

  const [username, setUsername] = useState("");
  const [chatList, setChatList] = useState([]);
  const [modalChatList, setModalChatList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [selectedRoomUsers, setSelectedRoomUsers] = useState([]);
  const [aiChatGenerating, setAiChatGenerating] = useState(false);
  const [aiPromptGenerating, setAiPromptGenerating] = useState(false);
  const [openMenuRoom, setOpenMenuRoom] = useState(false);
  const [promptRecommendText, setPromptRecommendText] = useState('')

  const [buttonOnOff, setButtonOnOff] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [modalOnOff, setModalOnOff] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);

  const initialZoom = 7.2;

  useEffect(() => {
    if (chatRef.current) {
        chatRef.current.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
  }, [aiChatGenerating]);

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

    // 소켓 연결 후 채팅 메시지 수신
    socketRef.current.on("chatMsg", (data) => {
      setChatList((prev) => [
        ...prev,
        { chat_id: data.chat_id,
          is_plan: data.is_plan,
          map_image: data.map_image,
          message: data.message,
          room_id: data.room_id,
          sender_id: data.sender_id,
          timestamp: data.timestamp
        },
      ]);
      if (chatRef.current) {
        chatRef.current.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });

    socketRef.current.on("AI_chat", (data) => {
      setChatList((prev) => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].chat_id === data.chat_id) {
          const updated = [...prev];
          if (aiChatGenerating) {
            setAiChatGenerating(false)
          }
          const lastMessage = updated[lastIndex];
          updated[lastIndex] = {
            chat_id: lastMessage.chat_id,
            sender_id: data.sender_id,
            message: lastMessage.message + data.message,
          };
          return updated;
        }
        // Otherwise, add a new AI message entry
        return [...prev, { chat_id: data.chat_id, message: data.message }];
      });
      if (chatRef.current) {
        chatRef.current.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });

    socketRef.current.on("AI_chat_done", () => {
      setAiChatGenerating(false);
      setButtonOnOff((prev) => {
        const copy = [...prev];
        copy[0] = false;
        return copy;
      });
      setCheckedIds([]);
    });

    socketRef.current.on("travel_plan", (data) => {
      setChatList((prev) => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].chat_id === data.chat_id) {
          const updated = [...prev];
          if (aiChatGenerating) {
            setAiChatGenerating(false)
          }
          const lastMessage = updated[lastIndex];
          updated[lastIndex] = {
            chat_id: lastMessage.chat_id,
            sender_id: data.sender_id,
            message: lastMessage.message + data.message,
          };
          return updated;
        }
        // Otherwise, add a new AI message entry
        return [...prev, { chat_id: data.chat_id, message: data.message }];
      });
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
      setCheckedIds([]);
    }
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
      console.log("채팅 내역:", data);
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
      chatHistory: checkedIds,
    };
    if (buttonOnOff[0]) {
      setAiChatGenerating(true);
    }
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

  const handleInvite = (frinedList) => {
    if (frinedList == []) return;
    socketRef.current.on("invite", (data) => {});
    socketRef.current.on("invite-error", (error) => {
      alert("초대에 실패하였습니다: " + error);
    });
    socketRef.current.emit("invite", { userlist: frinedList });
    setOpenMenuRoom(false);
    fetchRoomUsers();
  };

  const handleLeave = () => {
    socketRef.current.on("leave", (data) => {});
    socketRef.current.on("leave-error", (error) => {
      alert("방 나가기에 실패하였습니다: " + error);
    });
    socketRef.current.emit("leave", {});
    setOpenMenuRoom(null);
  };

  const RecommendPrompt = async () => {
    if (buttonOnOff[1]) {
      setButtonOnOff((prev) => {
        const copy = [...prev];
        copy[1] = false;
        return copy;
      });
      return;
    }
    try {
      if(promptRef.current){
        promptRef.current.innerText = "";
      }
      setPromptRecommendText("");
      setButtonOnOff((prev) => {
        const copy = [...prev];
        copy[1] = !copy[1];
        return copy;
      });
      const text = inputRef.current.value.trim();
      if (!text) return;

      setAiPromptGenerating(true);
      const res = await fetch("http://localhost:4000/api/v1/ai/prompt-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory:checkedIds, msg:text }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromptRecommendText(data.data);
        setAiPromptGenerating(false);
      } else {
        console.error("프롬프트 추천 실패:", data);
      }
    } catch (err) {
      console.error("프롬프트 추천 중 에러:", err);
    }
  };

  const OnClickPrompt = () => {
    if (promptRef.current) {
      inputRef.current.value = promptRef.current.innerText;
      setButtonOnOff((prev) => {
        const copy = [...prev];
        copy[1] = false;
        return copy;
      });
    }
  }
  
  const travel_plan = () => {
    if (buttonOnOff[2]) {
      setButtonOnOff((prev) => {
        const copy = [...prev];
        copy[2] = false;
        return copy;
      });
    }
    socketRef.current.emit("travel_plan", { chatHistory: checkedIds });
  }

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
          aiChatGenerating={aiChatGenerating}
          openMenuRoom={openMenuRoom}
          setOpenMenuRoom={setOpenMenuRoom}
          handleInvite={handleInvite}
          handleLeave={handleLeave}
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
            className="space-y-2 w-full h-full overflow-y-auto pb-[10vh]"
          >
            {chatList.map((chat, idx) => {
              if (chat.is_plan === 1) {
                return (
                  <div key={idx} className="w-full h-64 mb-4">
                    <ChatBubbleMap coords={chat.message} />
                  </div>
                );
              }

              if (chat.sender_id === username) {
                return (
                  <ChatBubbleMine key={idx}>
                    {chat.message}
                  </ChatBubbleMine>
                );
              } else {
                return (
                  <ChatBubbleOther key={idx} name={chat.sender_id}>
                    {chat.message}
                  </ChatBubbleOther>
                );
              }
            })}
            {aiChatGenerating && (
              <div className="flex flex-col w-full h-[30%]">
                <div className="flex flex-row items-center w-[100%]">
                  <Image src={logo_white} alt="logo" className="w-[5%] mr-1 ml-1" />
                  <div className="font-semibold">Sena</div>
                </div>
                <div className="flex justify-center items-center w-[100%] bg-[#EAEAEA] mt-2 h-[80%] rounded-lg text-2xl">
                  <div className="animate-pulse flex flex-row items-center space-x-2"> 
                    <LuLoader /> 
                    <span>AI가 답변을 생성 중입니다...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 하단 입력창 + 전송 버튼 */}
        <div className="absolute bottom-0 left-[29vw] right-[15vw] bg-white p-0">
          {buttonOnOff[1] && (
            <div className="flex flex-col justify-start items-center bg-[#EFEFEF] px-3 pt-2 rounded-lg relative z-0 h-[14vh] mb-[2vh]">
              <div className="text-gray-500 text-sm mb-1 w-full">
                아래와 같이 프롬프트를 다시 작성해 드릴까요?
              </div>
              <div
                className={`w-full bg-[#D0D0D0] h-[60%] p-1 rounded-lg overflow-y-auto ${
                  aiPromptGenerating ? "flex justify-center items-center font-bold" : ""
                }`} 
                ref={promptRef}
                onClick={OnClickPrompt}
              >
                {aiPromptGenerating ? <div className="flex flex-row items-center"><CiEdit className="text-xl"/>프롬프트 작성 중...</div> : promptRecommendText}
              </div>
            </div>
          )}
          <div className="p-2 mt-[-4vh] mb-[2vh] border rounded-[22px] bg-white relative z-10">
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
              disabled={selectedRoom === 0 || aiChatGenerating}
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
                  RecommendPrompt={RecommendPrompt}
                  travel_plan={travel_plan}
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
        </div>
      </main>
    </div>
  );
}

/*======== 채팅 버블 (Other) ========*/
function ChatBubbleOther({ name, children }) {
  const content =
    name === "Sena" ? (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside pl-6 mb-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1" {...props} />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mb-4" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    ) : (
      children
    );

  return (
    <div className="flex flex-col items-start mb-2">
      <div className="flex items-center">
        {name === "Sena" && (
          <Image
            src={logo_white}
            alt="logo"
            className="h-[2em] w-auto ml-1"
          />
        )}
        <div className="pl-2 font-semibold">{name}</div>
      </div>
      <div
        className={`${
          name === "Sena" ? "bg-[#EAEAEA]" : "bg-[#86D9FE]"
        } px-4 py-2 rounded-lg max-w-[70%] break-words ml-2`}
      >
        {content}
      </div>
    </div>
  );
}

/*======== 채팅 버블 (Mine) ========*/
function ChatBubbleMine({ children }) {
  return (
    <div className="flex flex-col items-end mb-2">
      <div className="bg-[#CCEFFF] text-black px-4 py-2 rounded-2xl max-w-[70%] break-words text-left mr-2">
        {children}
      </div>
    </div>
  );
}

function ChatBubbleMap({ coords }) {
  const coordsArr = JSON.parse(coords);

  if (!coordsArr || coordsArr.length === 0) return null;

  // 좌표 배열에서 위도와 경도 분리
  const lats = coordsArr.map(pos => Number(pos[0]));
  const lngs = coordsArr.map(pos => Number(pos[1]));

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // 지도 중심 계산
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // 위도, 경도의 차이를 이용해 범위 계산 (maxDelta가 작으면 좌표들이 가깝다는 뜻)
  const deltaLat = maxLat - minLat;
  const deltaLng = maxLng - minLng;
  const maxDelta = Math.max(deltaLat, deltaLng);

  // maxDelta에 따라 zoom 계산 (좌표들이 가까울수록 더 높은 zoom)
  let zoom;
  if (maxDelta === 0) {
    zoom = 14; // 모두 같은 경우 최대 zoom 설정
  } else {
    // 대략적인 공식: zoom = log2(360 / maxDelta)
    zoom = Math.log2(360 / maxDelta);
    // zoom 기본 범위 조정 (필요에 따라 clamp 값 조절)
    zoom = Math.min(12, Math.max(7, zoom));
  }

  return(
    <LoadScriptNext googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}>
      <GoogleMap
        mapContainerStyle={{ width: "70%", height: "100%" }}
        center={{ lat: centerLat, lng: centerLng }}
        zoom={zoom}
      >
        {coordsArr.map((pos, i) => (
          <MarkerF key={i} position={{ lat: Number(pos[0]), lng: Number(pos[1]) }} />
        ))}
      </GoogleMap>
  </LoadScriptNext>
  )
}

/*======== 모달채팅 버블 (Other) ========*/
function ModalChatBubbleOther({
  name,
  children,
  toggleCheck,
  checkedIds,
  chat,
}) {
  return (
    <div className="flex flex-col items-start mb-2 w-[100%]">
      <div className="text-sm font-semibold ml-2">{name}</div>
      <div className="flex flex-row w-[100%]">
        <div className="bg-sky-300 px-4 py-2 rounded-lg max-w-[70%] break-words ml-2">
          {children}
        </div>
        <button onClick={() => toggleCheck(chat.chat_id)} className="ml-2 mt-3">
          <GoCheckCircle
            className={`text-xl ${
              checkedIds.includes(chat.chat_id)
                ? "text-green-500"
                : "text-gray-300"
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
      <button onClick={() => toggleCheck(chat.chat_id)} className="mb-2 mr-2">
        <GoCheckCircle
          className={`text-xl ${
            checkedIds.includes(chat.chat_id)
              ? "text-green-500"
              : "text-gray-300"
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
  RecommendPrompt,
  travel_plan,
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
              onClick={() => {
                if (idx === 1) {
                  RecommendPrompt();
                } 
                else if(idx==2){
                  travel_plan();
                }
                else {
                  SetButtonOnOff((prev) => {
                    const copy = [...prev];
                    copy[idx] = !copy[idx];
                    return copy;
                  });
                }
              }}
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
          className="px-3 py-1 rounded-full border text-sm bg-white"
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
              <div
                className="flex justify-end mb-2 items-center w-[100%]"
                key={idx}
              >
                <ModalChatBubbleMine
                  toggleCheck={toggleCheck}
                  checkedIds={checkedIds}
                  chat={chat}
                >
                  {chat.message}
                </ModalChatBubbleMine>
              </div>
            ) : (
              <div
                className="flex justify-start mb-2 items-center w-[100%]"
                key={idx}
              >
                <ModalChatBubbleOther
                  key={idx}
                  name={chat.sender_id}
                  toggleCheck={toggleCheck}
                  checkedIds={checkedIds}
                  chat={chat}
                >
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