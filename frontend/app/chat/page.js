"use client"

import Sidebar from "../components/Sidebar"
import { useState, useEffect, useRef } from "react"
import { GoCpu, GoPencil, GoFile, GoSearch, GoCheckCircle, GoPaperAirplane } from "react-icons/go";

export default function ChatRoom() {
	const [buttonOnOff, SetButtonOnOff] = useState([false, false, false, false, false]);
	const chatRef = useRef(null);

	useEffect(() => {
		if (chatRef.current) {
			chatRef.current.scrollTo({
			top: chatRef.current.scrollHeight,
			behavior: "smooth"});
		}
	}, []);

	return (
		<div className="flex h-screen">

			{/* 사이드바 */}
			<div className="h-full w-1/7">
				<Sidebar />
			</div>
			

			{/* 채팅창 */}
			<main className="flex-1 bg-white pt-[7vh] pb-[20vh] px-[15vw] w-6/7">
				<div ref={chatRef} className="space-y-2 w-[100%] h-[100%] overflow-y-auto">
					<ChatBubbleMine>우리 중간 보고 어디 놀러갈래?</ChatBubbleMine>
					<ChatBubbleOther name="중현">저번에 말했던 영국 런던은 어때?</ChatBubbleOther>
					<ChatBubbleOther name="주호">거기 가면 뭐함?</ChatBubbleOther>
					<ChatBubbleOther name="중현">몰루? 학주가 제안함</ChatBubbleOther>
					<ChatBubbleOther name="현주">뮤지컬이나 박물관 아니면 축구 유니폼 쇼핑하던가 할 거는 많지우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?</ChatBubbleOther>
					<ChatBubbleMine>우리 중놀러갈래간 보고 어디 ? 우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?우리 중놀러갈래간 보고 어디 ?</ChatBubbleMine>
					<ChatBubbleOther name="중현">저번에 말했던 영국 런던은 어때?</ChatBubbleOther>
					<ChatBubbleOther name="주호">거기 가면 뭐함?</ChatBubbleOther>
					<ChatBubbleOther name="중현">몰루? 학주가 제안함</ChatBubbleOther>
					<ChatBubbleOther name="현주">뮤지컬이나 박물관 아니면 축구 유니폼 쇼핑하던가 할 거는 많지</ChatBubbleOther>
					<ChatBubbleMine>AI한테 함 계획 짜달라고 해볼게</ChatBubbleMine>
					<ChatBubbleMine>우리 중간 보고 어디 놀러갈래?</ChatBubbleMine>
					<ChatBubbleOther name="중현">저번에 말했던 영국 런던은 어때?</ChatBubbleOther>
					<ChatBubbleOther name="주호">거기 가면 뭐함?</ChatBubbleOther>
					<ChatBubbleOther name="중현">몰루? 학주가 제안함</ChatBubbleOther>
					<ChatBubbleOther name="현주">뮤지컬이나 박물관 아니면 축구 유니폼 쇼핑하던가 할 거는 많지</ChatBubbleOther>
				</div>
				
				{/* 하단 입력창 */}
				<div className="absolute bottom-0 left-[29vw] right-[15vw] border-t bg-white p-4 mb-[2vh] border rounded-xl">
					<textarea
						rows={1}
						className="w-full resize-none overflow-y-auto border p-2 rounded shadow focus:outline-none border-none"
						style={{ maxHeight: '30vh' }}
					/>
					<div className="flex justify-between items-center">
						<ButtonList SetButtonOnOff={SetButtonOnOff} buttonOnOff={buttonOnOff}/>
						<button className="p-2 text-white bg-blue-500 rounded-2xl shadow hover:bg-blue-600"><GoPaperAirplane className="text-base"/></button>
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

function ButtonList({SetButtonOnOff, buttonOnOff}){
	const buttonTitle = ["AI에게 물어보기", "프롬프트 추천", "일정표 형식 답변 생성", "대화 내역 검색"];
	return(
		<div className="flex space-x-2">
			{[0, 1, 2, 3, 4].map((idx) => {
				const label = buttonTitle[idx];
				return (
					<button
						key={idx}
						onClick={() => SetButtonOnOff(prev => {
							const newState = [...prev];
							newState[idx] = !prev[idx];
							return newState;
						})}
						className={`px-3 py-1 rounded-full border text-sm ${
							buttonOnOff[idx] ? "bg-sky-400 text-white" : "bg-white text-black"
						}`}
					>	
						<div className="flex items-center space-x-1">
							{idx === 4 ? (
								<GoCheckCircle className="text-2xl" />
							) : (
								<>
									{idx === 0 && <GoCpu className="text-base" />}
									{idx === 1 && <GoPencil className="text-base" />}
									{idx === 2 && <GoFile className="text-base" />}
									{idx === 3 && <GoSearch className="text-base" />}
									<span>{label}</span>
								</>
							)}
						</div>
					</button>
				);
			})}
		</div>
	)
}