
export default function Sidebar() {
	return (
		<div className="h-screen w-full min-w-auto">
			<aside className="h-screen w-64 bg-sky-200 p-4">
				<h1 className="text-xl font-bold text-white mb-4">SENA.AI</h1>
				<div className="text-white font-semibold mb-2">CHATROOMS</div>
				<ul>
					<li className="bg-white text-black rounded p-2 mb-2 shadow">런던여행✈️</li>
					<li className="text-white">+ New chat</li>
				</ul>
			</aside>
		</div>
	)
}