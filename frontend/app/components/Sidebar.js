import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactModal from "react-modal";
import { AiOutlineUserAdd, AiOutlineUserDelete } from "react-icons/ai";
import { LuUser } from "react-icons/lu";

import logo_blue from "../../public/logo_blue.png";

export default function Sidebar({
  roomList,
  SetRoomList,
  selectedRoom,
  SetSelectedRoom,
  selectedRoomUsers,
  username,
  aiChatGenerating,
  openMenuRoom,
  setOpenMenuRoom,
  handleInvite={handleInvite},
  handleLeave={handleLeave},
}) {
  const router = useRouter();

  const [isInvite, SetIsInvite] = useState(false);
  const [inviteUsername, SetInviteUsername] = useState("");
  const [invitedUsers, SetInvitedUsers] = useState([]);
  const [modalOnOff, SetModalOnOff] = useState(false);
  const [newRoomName, SetNewRoomName] = useState("");

  useEffect(() => {
    if(!modalOnOff){
      SetIsInvite(false);
      SetInviteUsername("");
      SetInvitedUsers([]);
      SetNewRoomName("");
      setOpenMenuRoom(false);
    }
  }, [modalOnOff]);

  const CreateNewRoom = async () => {
    try {
      // 자신의 이름 1번만 들어가게 함
      const filtered = invitedUsers.filter((user) => user !== username);
      const userList = [...filtered, username];
      const response = await fetch("http://localhost:4000/api/v1/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomname: newRoomName, userlist: userList }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Failed to fetch rooms:", data);
        return;
      }
      SetRoomList((prev) => [
        ...prev,
        { room_id: data.data.room_id, room_name: data.data.room_name },
      ]);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  };



  const Logout = () => {
    sessionStorage.removeItem("username");
    router.push("/login");
  };
  return (
    <div style={{ width: "100%", backgroundColor: "#84CDEE", height: "100vh" }}>
      <CreateRoomModal
        modalOnOff={modalOnOff}
        SetModalOnOff={SetModalOnOff}
        newRoomName={newRoomName}
        SetNewRoomName={SetNewRoomName}
        inviteUsername={inviteUsername}
        SetInviteUsername={SetInviteUsername}
        invitedUsers={invitedUsers}
        SetInvitedUsers={SetInvitedUsers}
        CreateNewRoom={CreateNewRoom}
        username={username}
        isInvite={isInvite}
        handleInvite={handleInvite}
      />
      <div
        style={{ width: "100%", height: "15%" }}
        className="flex flex-row items-center text-white"
      >
        <Image src={logo_blue} alt="logo" className="w-[24%] h-auto p-0 m-0" />
        <div className="w-[60%] text-3xl">SENA.AI</div>
      </div>

      <div className="w-full h-[65%] px-[4%] overflow-y-auto">
        <div className="text-white bold mb-[3%]">CHATROOMS</div>
        {roomList.map((idx) => {
          const isSelected = idx.room_id === selectedRoom;
          return (
            <div key={idx.room_id} className="relative">
              <div
                onClick={(e) => {
                  if (!aiChatGenerating) {
                    SetSelectedRoom(idx.room_id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`cursor-pointer ${
                  isSelected
                    ? "flex flex-row items-center bg-white text-[#84CDEE] py-[5%] px-[7%] mb-[3%] w-[100%] rounded-[6px]"
                    : "flex flex-row items-center border border-white text-white py-[5%] px-[7%] mb-[3%] w-[100%] rounded-[6px]"
                }`}
              >
                <span className="flex-shrink-0">{idx.room_name}</span>
                {isSelected && (
                  <>
                    <div className="flex items-center ml-auto text-[#84CDEE]">
                      <LuUser className="inline mb-1" />
                      {selectedRoomUsers.length}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuRoom(openMenuRoom === idx.room_id ? null : idx.room_id);
                      }}
                      className={ isSelected ? "ml-1 px-2 text-xl hover:bg-white hover:text-[#84CDEE] rounded" :"ml-auto text-xl hover:bg-white hover:text-[#84CDEE] rounded"}
                      title="메뉴 열기"
                      type="button"
                    >
                      ⋮
                    </button>
                  </>
                )}
              </div>
              {/* 메뉴 드롭다운 */}
              {openMenuRoom === idx.room_id && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded border shadow-lg z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      SetIsInvite(true);
                      SetInviteUsername("");
                      SetInvitedUsers([]);
                      SetModalOnOff(true);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    친구 초대
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeave(idx.room_id);
                      SetSelectedRoom(0);
                      SetRoomList((prev) =>
                        prev.filter((room) => room.room_id !== idx.room_id)
                      );
                      setOpenMenuRoom(false);
                    }}
                    className="block w-full bg-red-500 text-white text-left px-4 py-2 hover:bg-red-600"
                  >
                    방 나가기
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => SetModalOnOff(true)}
          style={{ borderRadius: "6px" }}
          className="flex flex-row bg-white py-[5%] px-[7%] w-[100%]"
        >
          <div style={{ color: "#84CDEE" }} className="mr-[5%]">
            +
          </div>
          <div style={{ color: "#84CDEE" }}>New Chat</div>
        </button>
      </div>

      <div className="flex flex-row text-white items-center justify-center mb-[6%] w-[100%] text-2xl">
        {username}
      </div>
      <div className="flex flex-row items-center justify-center w-[100%]">
        <button onClick={()=> Logout()} className="flex flex-row items-center justify-center w-[60%] bg-white text-[#84CDEE] py-[3%] px-[5%] rounded-[6px] hover:bg-gray-200 transition-colors">
          Log out
        </button>
      </div>
    </div>
  );
}

function CreateRoomModal({
  modalOnOff,
  SetModalOnOff,
  newRoomName,
  SetNewRoomName,
  inviteUsername,
  SetInviteUsername,
  invitedUsers,
  SetInvitedUsers,
  CreateNewRoom,
  username,
  isInvite,
  handleInvite,
}) {
  const addUser = () => {
    const trimmedName = inviteUsername.trim();
    if (trimmedName && !invitedUsers.includes(trimmedName)) {
      SetInvitedUsers([...invitedUsers, trimmedName]);
      SetInviteUsername("");
    }
  };

  const removeUser = (name) => {
    SetInvitedUsers(invitedUsers.filter((user) => user !== name));
  };

  const InviteHandler = () => {
    SetModalOnOff(false);
    const friendList = invitedUsers.filter((user) => user !== username);
    handleInvite(friendList);
  }

  const handleApply = () => {
    if(newRoomName == ""){
      alert("방 이름은 필수입니다.")
      return
    }
    SetModalOnOff(false);
    CreateNewRoom();
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
          backgroundColor: "white",
        },
      }}
    >
      <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-4">
        <div style={{ color: "#A8A8A8" }} className="text-lg font-semibold">
          채팅방 설정
        </div>
        <button
          onClick={() => SetModalOnOff(false)}
          className="text-gray-500 hover:text-black text-3xl font-bold"
        >
          &times;
        </button>
      </div>
      <div className="flex flex-col flex-grow px-6">
        {!isInvite && (
          <>
            <label style={{ color: "#A8A8A8" }} className="font-medium mb-2">
              방 이름
            </label>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => SetNewRoomName(e.target.value)}
              placeholder="방 이름을 입력해주세요"
              className="border border-gray-300 rounded-md px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </>
        )}
        

        <label style={{ color: "#A8A8A8" }} className="font-medium mb-2">
          초대할 유저 이름
        </label>
        <div className="relative mb-4">
          <input
            type="text"
            value={inviteUsername}
            onChange={(e) => SetInviteUsername(e.target.value)}
            placeholder="유저 이름 입력"
            className="border border-gray-300 rounded-md px-4 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUser();
              }
            }}
          />
          <button
            onClick={addUser}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-600"
            type="button"
            aria-label="Add user"
          >
            <AiOutlineUserAdd size={24} />
          </button>
        </div>

        <span style={{ color: "#A8A8A8" }}>초대한 유저</span>
        <div className="flex-grow border border-gray-300 rounded-md p-3 overflow-y-auto mb-6">
          {invitedUsers.length === 0 ? (
            <p className="text-gray-400 text-sm">초대된 유저가 없습니다.</p>
          ) : (
            invitedUsers.map((user) => (
              <div
                key={user}
                className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-100 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">{user}</span>
                </div>
                <button
                  onClick={() => removeUser(user)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${user}`}
                >
                  <AiOutlineUserDelete size={20} />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={isInvite ? InviteHandler : handleApply}
          style={{ backgroundColor: "#11B8FF" }}
          className="hover:bg-blue-600 text-white font-semibold py-3 rounded-md transition-colors"
        >
          {isInvite? "초대하기" : "생성하기"}
        </button>
      </div>
    </ReactModal>
  );
}
