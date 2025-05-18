import Sidebar from "../components/Sidebar"

export default function ChatRoom() {
	return (
		<div className="flex h-screen">

			{/* 사이드바 */}
			<div className="h-full w-1/7">
				<Sidebar />
			</div>
			

			{/* 채팅창 */}
			<main className="flex-1 bg-white p-6 overflow-y-auto w-6/7">
				<div className="mb-4 text-right text-sky-600 font-semibold">우리 중간하면 어디로 여행갈래?</div>
		
				<div className="space-y-2">
					<ChatBubble name="중현">저번에 말했던 영국 런던은 어때?</ChatBubble>
					<ChatBubble name="주호">거기 가면 뭐함?</ChatBubble>
					<ChatBubble name="중현">몰루? 학주가 제안함</ChatBubble>
					<ChatBubble name="현주">뮤지컬이나 박물관 아니면 축구 유니폼 쇼핑하던가 할 거는 많지</ChatBubble>
					<div className="text-right text-sky-600 font-semibold">AI한테 한 여행 계획 짜달라 할께</div>
				</div>
		
				{/* 하단 입력창 */}
				<div className="border-t p-4 sticky bottom-0 bg-white">
					<input
						type="text"
						placeholder="안녕 세나야. 6월 중순부터..."
						className="w-full border p-2 rounded shadow"
					/>
				</div>
			</main>
		</div>
	)
}

function ChatBubble({ name, children }) {
	return (
		<div className="bg-sky-100 text-black px-4 py-2 rounded-lg max-w-fit shadow">
			<div className="text-sm font-semibold">{name}</div>
			<div>{children}</div>
		</div>
	)
}