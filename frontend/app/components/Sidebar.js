import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import ReactModal from "react-modal";
import { AiOutlineUserAdd, AiOutlineUserDelete } from 'react-icons/ai';

import logo_blue from '../../public/logo_blue.png';

export default function Sidebar({ roomList, SetRoomList, username }) {

	const [inviteUsername, SetInviteUsername] = useState('');
	const [invitedUsers, SetInvitedUsers] = useState([]);
	const [modalOnOff, SetModalOnOff] = useState(false)
	const [newRoomName, SetNewRoomName] = useState('')

	const CreateNewRoom = async() => {
		try {
			const userList = [...invitedUsers, username]
			const response = await fetch('http://localhost:4000/api/v1/rooms', {
				method: 'POST',
				headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "roomname":newRoomName, "userlist":userList })
			});
			const data = await response.json();
			if (!response.ok) {
				console.error('Failed to fetch rooms:', data);
				return;
			}
			SetRoomList(prev => [
				...prev,
				{ roomId: data.data.roomId, roomname: data.data.roomname }
			]);
			console.log(data)
		} catch (error) {
			console.error('Error fetching chat rooms:', error);
		}
	}
	
	return (
		<div style={{width: '100%', backgroundColor:'#84CDEE', height: '100vh'}}>

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
			/>
			<div style={{width: '100%', height:'15%'}} className='flex flex-row items-center text-white'>
				<Image
					src={logo_blue}
					alt="logo"
					className="w-[24%] h-auto p-0 m-0"
				/>
				<div className='w-[60%] text-3xl'>
					SENA.AI
				</div>
			</div>

			<div className='w-full h-[70%] px-[4%]'>
				<div className='text-white bold mb-[3%]'>
					CHATROOMS
				</div>
				{roomList.map((idx)=> {
					return (
						<div key={idx.room_id} style={{borderRadius:"6px"}} className='flex flex-row bg-white py-[5%] px-[7%]'>
							{idx.room_name}
						</div>
					)
				})}
				<button
					onClick={()=> SetModalOnOff(true)}
					style={{borderRadius:"6px"}}
					className='flex flex-row bg-white py-[5%] px-[7%] w-[100%]'>
					<div style={{color:"#84CDEE"}} className='mr-[5%]'>
						+
					</div>
					<div style={{color:"#84CDEE"}}>
						New Chat
					</div>
				</button>
			</div>

			<div className='flex flex-row text-white items-center h-[15%] pl-[20%] text-2xl'>
				{username}
			</div>
		</div>
	)
}


function CreateRoomModal({modalOnOff, SetModalOnOff, newRoomName, SetNewRoomName, inviteUsername, SetInviteUsername, invitedUsers, SetInvitedUsers, CreateNewRoom, username}) {
	const addUser = () => {
		const trimmedName = inviteUsername.trim();
		if(trimmedName && !invitedUsers.includes(trimmedName)){
			SetInvitedUsers([...invitedUsers, trimmedName]);
			SetInviteUsername('');
		}
	};

	const removeUser = (name) => {
		SetInvitedUsers(invitedUsers.filter(user => user !== name));
	};

	const handleApply = () => {
		SetModalOnOff(false);
		console.log("방 이름:", newRoomName);
		console.log("초대된 유저:", invitedUsers);
		CreateNewRoom();
	};

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
					flexDirection: 'column',
					backgroundColor: 'white'
				},
			}}
		>
			<div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-4">
				<div style={{color:"#A8A8A8"}} className='text-lg font-semibold'>
					채팅방 설정
				</div>
				<button onClick={() => SetModalOnOff(false)} className="text-gray-500 hover:text-black text-3xl font-bold">&times;</button>
			</div>
			<div className="flex flex-col flex-grow px-6">
				<label style={{color:"#A8A8A8"}} className="font-medium mb-2">방 이름</label>
				<input
					type="text"
					value={newRoomName}
					onChange={(e) => SetNewRoomName(e.target.value)}
					placeholder="방 이름을 입력해주세요"
					className="border border-gray-300 rounded-md px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>

				<label style={{color:"#A8A8A8"}} className="font-medium mb-2">초대할 유저 이름</label>
				<div className="relative mb-4">
					<input
						type="text"
						value={inviteUsername}
						onChange={(e) => SetInviteUsername(e.target.value)}
						placeholder="유저 이름 입력"
						className="border border-gray-300 rounded-md px-4 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
						onKeyDown={(e) => { if(e.key === 'Enter'){ e.preventDefault(); addUser(); } }}
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
				
				<span style={{color:"#A8A8A8"}}>초대한 유저</span>
				<div className="flex-grow border border-gray-300 rounded-md p-3 overflow-y-auto mb-6">
					{invitedUsers.length === 0 ? (
						<p className="text-gray-400 text-sm">초대된 유저가 없습니다.</p>
					) : (
						invitedUsers.map((user) => (
							<div key={user} className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-100 rounded-md">
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
					onClick={handleApply}
					style={{backgroundColor:"#11B8FF"}}
					className="hover:bg-blue-600 text-white font-semibold py-3 rounded-md transition-colors"
				>
					생성하기
				</button>
			</div>
		</ReactModal>
	)
}
