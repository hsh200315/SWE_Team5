"use client"

import Sidebar from "../components/Sidebar"
import { useState, useEffect, useRef } from "react"
import ReactModal from "react-modal";
import { GoCpu, GoPencil, GoFile, GoSearch, GoCheckCircle, GoPaperAirplane } from "react-icons/go";

export default function ChatRoom() {

	const [username, setUsername] = useState('');
	const [chatList, SetChatList] = useState([]);
	const [roomList, SetRoomList] = useState([]);
	const [selectedRoom, SetSelectedRoom] = useState(0);

	const [buttonOnOff, SetButtonOnOff] = useState([false, false, false, false, false]);
	const [modalOnOff, SetModalOnOff] = useState(false)
	const [chatChecked, SetChatChecked] = useState(false)
	const chatRef = useRef(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			ReactModal.setAppElement("body");
			const storedUser = sessionStorage.getItem('username');
			if (storedUser) {
				setUsername(storedUser);
			}
		}
		if (chatRef.current) {
			chatRef.current.scrollTo({
			top: chatRef.current.scrollHeight,
			behavior: "smooth"});
		}
	}, []);

	useEffect(() => {
		if(username === '') return;
		GetRoomList()
	}, [username]);

	useEffect(() => {
		console.log("selectedRoom", selectedRoom);
		if (selectedRoom !== 0) {
			GetChat();
		}
	}, [selectedRoom]);

	const GetRoomList = async() => {
		try {
			const response = await fetch('http://localhost:4000/api/v1/roomlist', {
				method: 'POST',
				headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
			});
			const data = await response.json();
			if (!response.ok) {
				console.error('Failed to fetch rooms:', data);
				return;
			}
			console.log(data.data);
			SetRoomList(data.data);
		} catch (error) {
			console.error('Error fetching chat rooms:', error);
		}
	}

	const GetChat = async() => {
		try {
			const response = await fetch(`http://localhost:4000/api/v1/rooms/${selectedRoom}/messages`, {
				method: 'GET',
			});
			const data = await response.json();
			if (!response.ok) {
				console.error('Failed to fetch chat:', data);
				return;
			}
			console.log(data.data);
			SetChatList(data.data);
		} catch (error) {
			console.error('Error fetching chat rooms:', error);
		}
	}


	return (
		<div className="flex h-screen">
			{/* 모달창 */}
			<CheckModal 
				modalOnOff={modalOnOff}
				SetModalOnOff={SetModalOnOff}
				chatChecked={chatChecked}
				SetChatChecked={SetChatChecked}/>

			{/* 사이드바 */}
			<div className="h-full w-1/7">
				<Sidebar
					roomList={roomList}
					SetRoomList={SetRoomList}
					selectedRoom={selectedRoom}
					SetSelectedRoom={SetSelectedRoom}
					username={username}
				/>
			</div>
			

			{/* 채팅창 */}
			<main className="flex-1 bg-white pt-[7vh] pb-[20vh] px-[15vw] w-6/7">
				<div ref={chatRef} className="space-y-2 w-[100%] h-[100%] overflow-y-auto">
					{chatList.map((chat, index) => (
						chat.sender === username ? (
							<ChatBubbleMine key={index}>{chat.message}</ChatBubbleMine>
						) : (
							<ChatBubbleOther key={index} name={chat.sender}>
								{chat.message}
							</ChatBubbleOther>
						)
					))}
				</div>

				
				{/* 하단 입력창 */}
					<div className="absolute bottom-0 left-[29vw] right-[15vw] bg-white p-2 mb-[2vh] border rounded-[22px]">
						<textarea
							rows={1}
							style={{ maxHeight: '4.5rem' }}
							placeholder="어디로 가고 싶으신가요? 무엇이든 물어보세요."
							onInput={(e) => {
								e.target.style.height = 'auto';
								e.target.style.height = `${Math.min(e.target.scrollHeight, 72)}px`; // 72px = ~2 lines
							}}
							className="w-full resize-none overflow-y-auto p-2 rounded shadow-none focus:outline-none border-none"
						/>
						<div className="flex justify-between items-center">
							<ButtonList 
								SetButtonOnOff={SetButtonOnOff}
								buttonOnOff={buttonOnOff}
								SetModalOnOff={SetModalOnOff}
								chatChecked={chatChecked}
								setChatChecked={SetChatChecked}/>
							<button style={{backgroundColor:"#11B8FF"}} className="p-2 rounded-2xl shadow text-white hover:bg-blue-600"><GoPaperAirplane className="text-base"/></button>
						</div>
					</div>
				
			</main>
		</div>
	)
}

function ChatBubbleOther({ name, children }) {
	return (
		
		<div className=" text-black w-fit max-w-[70%]">
			<div className="text-sm font-semibold">{name}</div>
			<div className="bg-sky-300 px-4 py-2 rounded-lg">{children}</div>
		</div>
	)
}

function ChatBubbleMine({ children }) {
	return (
		<div className="flex justify-end mb-2">
			<div className="bg-sky-100 text-black px-4 py-2 rounded-2xl w-fit max-w-[70%] text-left">
				{children}
			</div>
		</div>
	)
}

function ButtonList({ SetButtonOnOff, buttonOnOff, SetModalOnOff, chatChecked }) {
	const buttonTitle = ["AI에게 물어보기", "프롬프트 추천", "일정표 형식 답변 생성", "대화 내역 검색"];

	return(
		<div className="flex justify-center">
			<div className="flex space-x-2">
				{[0, 1, 2].map((idx) => {
					const label = buttonTitle[idx];
					return (
						<button
							key={idx}
							onClick={() => SetButtonOnOff(prev => {
								const newState = [...prev];
								newState[idx] = !prev[idx];
								return newState;
							})}
							style={{borderColor:"#D4D4D4"}}
							className={`px-3 py-1 rounded-full border text-sm ${
								buttonOnOff[idx] ? "bg-sky-400" : "bg-white"
							}`}
						>	
							<div className="flex items-center space-x-1" style={{color: buttonOnOff[idx] ? 'white' : '#8F8F8F'}}>
								<>
									{idx === 0 && <GoCpu className="text-base" />}
									{idx === 1 && <GoPencil className="text-base" />}
									{idx === 2 && <GoFile className="text-base" />}
									{idx === 3 && <GoSearch className="text-base" />}
									<span>{label}</span>
								</>
							</div>
						</button>
					);
				})}
			</div>
			<div className="flex space-x-2">
				<button
					key={3}
					onClick={()=>SetModalOnOff(prev => !prev)}
					style={{borderColor:"#D4D4D4"}}
					className={`px-3 py-1 rounded-full border text-sm ${
						buttonOnOff[3] ? "bg-sky-400" : "bg-white"
					}`}
				>	
					<div className="flex items-center space-x-1" style={{color: buttonOnOff[3] ? 'white' : '#8F8F8F'}}>
						<> 
							<GoSearch className="text-base" />
							<span>{buttonTitle[3]}</span>
						</>
					</div>
				</button>
			</div>
			<div className="flex items-center justify-center">
				<button 
					style={{
						color: chatChecked ? '#ffffff' : '#8F8F8F',
						borderColor: chatChecked ? '#4ade80' : '#D4D4D4',
						backgroundColor: chatChecked ? '#4ade80' : '#ffffff',
					}}
					className={'ml-[0.5rem] rounded-full border text-3xl transition-colors duration-200 border-none'}
				>
					<GoCheckCircle />
				</button>
			</div>
		</div>
	)
}

function CheckModal({modalOnOff, SetModalOnOff, chatChecked, SetChatChecked}){
	function ClickEvent(){
		SetChatChecked(!chatChecked)
		SetModalOnOff(!modalOnOff)
	}

	return(
		<ReactModal
			isOpen={modalOnOff}
			onRequestClose={() => SetModalOnOff(false)}
			ariaHideApp={false}
			style={{
				overlay: {
					backgroundColor: 'rgba(0, 0, 0, 0.4)',
					zIndex: 50,
				},
				content: {
					top: '20%',
					left: '50%',
					right: 'auto',
					bottom: 'auto',
					transform: 'translate(-50%, 0)',
					width: '50vw',
					height: '60vh',
					padding: '1rem',
					borderRadius: '1rem',
					border: '1px solid #ccc',
					boxShadow: '0 0 10px rgba(0,0,0,0.2)',
					display: 'flex',
					flexDirection: 'column'
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
				<button onClick={() => SetModalOnOff(false)} className="text-gray-500 hover:text-black text-3xl font-bold">&times;</button>
			</div>

			{/* Top Right Toggle Buttons */}
			<div className="flex justify-end w-[100%] h-[5%]">
				<select className="border w-[20%]">
					<option>Both</option>
					<option>Checked</option>
					<option>Unchecked</option>
				</select>
			</div>
			

		{/* Chat content area */}
		<div className="flex-1 overflow-y-auto border-none rounded bg-gray-100 p-3 space-y-2">
			<ChatBubbleMine>우리 중강하면 어디로</ChatBubbleMine>
			<ChatBubbleOther name="중현">저번에 말했던 영국 런던은 어때?</ChatBubbleOther>
			<ChatBubbleOther name="주호">거기 가면 뭐함?</ChatBubbleOther>
			<ChatBubbleOther name="중현">몰루? 학주가 제안함</ChatBubbleOther>
			<ChatBubbleMine>우리 중강하면 어디로</ChatBubbleMine>
			<ChatBubbleOther name="중현">저번에 말했던 영국 런던은 어때?</ChatBubbleOther>
			<ChatBubbleOther name="주호">거기 가면 뭐함?</ChatBubbleOther>
			<ChatBubbleOther name="중현">몰루? 학주가 제안함</ChatBubbleOther>
		</div>

		  {/* Footer Button */}
		  <div className="mt-4 flex justify-end">
			<button 
				onClick={() => ClickEvent()}
				className="bg-green-500 text-white px-4 py-2 rounded-full text-sm shadow hover:bg-green-600">
			  선택된 채팅 내역 질문에 포함
			</button>
		  </div>
		</ReactModal>
	)
}