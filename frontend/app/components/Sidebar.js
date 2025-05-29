import Image from 'next/image';
import { useState } from 'react';

export default function Sidebar() {
	const [chatRooms, setChatRooms] = useState(['런던여행팟']);
	const [isHover, setIsHover] = useState(false);
	const [openMenuIdx, setOpenMenuIdx] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newRoomName, setNewRoomName] = useState('');
	const [inviteUser, setInviteUser] = useState([]);
	const [invitedUsers, setInvitedUsers] = useState([]);
	const [editingRoomIdx, setEditingRoomIdx] = useState(null);

	const addChatRoom = () => {
    if (newRoomName.trim()) {
      	setChatRooms(prevRooms => [...prevRooms, newRoomName.trim]);
		setNewRoomName('');
		setInvitedUsers([]);
		setIsModalOpen(false);
      // 새로 추가된 채팅방이 아래에 나오도록
    }
  	};
	const deleteChatRoom = (idx) => {
		setChatRooms(prev=>prev.filter((_, i) => i !== idx));
		setOpenMenuIdx(null);
	};
	const openRoomSetting = (idx) => {
		setEditingRoomIdx(idx);
		setIsModalOpen(true);
		setOpenMenuIdx(null);
	};
	
	/*const addInvitedUser = () => {
		if (inviteUser.trim() && !invitedUsers.includes(inviteUser.trim())) {
			setInvitedUsers(prev => [...prev, inviteUser.trim()]);
			setInviteUser('');
		}
	};*/
	return (
		<div style={{backgroundColor: '#84CDEE', height: '100vh', paddingTop:'40px'}}>
			{/* 사이드바 전체 */}
			<div style={{display: 'flex', alignItems:'center', gap: '5px', }}>
				{/* 사이드바 로고 및 이름 */}
				<Image
					src="/logo_blue.png"
					alt="sidebar logo"
					width={50}
					height={50}
				/>
				<span style={{fontFamily: 'Roboto, sans-serif', fontWeight: 200,fontSize: '30px', color: 'white'}}>
					SENA.AI
				</span>
			</div>
			<div style={{marginTop: '20px', paddingLeft:'10px', paddingRight:'10px'}}>
				<span style={{fontFamily: 'Roboto, sans-serif', fontWeight: 700,fontSize: '10px', color: 'white'}}>
					CHATROOMS
				</span>
				{/* 채팅방 목록 */}
      			<div>
        			{chatRooms.map((room, idx) => (
          			<div
            		key={idx}
            		style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					width: '100%',
					padding: '10px',
					marginBottom: '10px',
					borderRadius: '8px',
					backgroundColor: '#84CDEE',
					cursor: 'pointer',
					border: '1px solid white',
					position: 'relative',
					}}
					onClick={()=> console.log(`${room} 클릭`)}
          			>
            		{/* 방 이름 */}
              		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<span style={{ fontSize: '14px', color: 'white' }}>{room}</span>
					<span
					style={{color: 'white'}}>👤4</span>
				</div>

              	{/* 더보기 버튼 */}
              	<button
                	onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuIdx(openMenuIdx === idx ? null : idx);
                	}}
                	style={{
					border: 'none',
					cursor: 'pointer',
					fontSize: '18px',
					lineHeight: '1',
					color: 'white',
					backgroundColor: '#84CDEE',
					}}
              	>
                ⋮
              	</button>

              	{/* 더보기 메뉴 */}
              	{openMenuIdx === idx && (
                <div
                  style={{
                    position: 'absolute',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    marginTop: '40px',
                    right: '20px',
                    zIndex: 10,
					display: 'flex',
					flexDirection: 'column',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
					  setIsModalOpen(true);
					  setOpenMenuIdx(null);
                    }}
                    style={{
						display: 'flex',
						alignItems: 'center',
						padding: '8px 12px',
						width: '100%',
						background: 'none',
						border: 'none',
						cursor: 'pointer',
                    }}
                  >
                ⚙️ <span style={{ marginLeft: '5px' }}>Room Setting</span>
                  </button>
				  <button
										onClick={(e) => {
											e.stopPropagation();
											deleteChatRoom(idx);
										}}
										style={{
											display: 'flex',
											alignItems: 'center',
											padding: '8px 12px',
											width: '100%',
											background: 'red',
											color: 'white',
											border: 'none',
											cursor: 'pointer',
										}}
									>
										🗑 <span style={{ marginLeft: '5px' }}>Delete Chatroom</span>
									</button>
                </div>
              	)}
          	</div>
        ))}
      </div>

      {/* 새로운 채팅방 만들기 버튼 */}
      <button
        onClick={()=>setIsModalOpen(true)}
		onMouseEnter={()=>setIsHover(true)}
		onMouseLeave={()=>setIsHover(false)}
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isHover ? 'white' : '#84CDEE',
          color: isHover ? '#84CDEE' : 'white',
          cursor: 'pointer',
		  border: isHover ? 'none' : '1px dashed white',
        }}
      >
        + New chat
      </button>
	  <span
	  style={{
		position: 'absolute',
		bottom: '65px',
		left: '10px',
		right: '10px',
		width:'10%',
		padding: '10px',
      	backgroundColor: '#84CDEE',
      	color: 'white',
      	cursor: 'pointer',
		}}
	  >
		현석
	  </span>
	  <button
		onClick={()=> console.log('로그아웃')}
		style={{
		position: 'absolute',
		bottom: '20px',
		left: '10px',
		right: '10px',
		width:'10%',
		padding: '10px',
      	backgroundColor: '#84CDEE',
      	color: 'white',
      	cursor: 'pointer',
		}}
		>
			Log out
	  </button>
	{/* 모달창 */}
			{isModalOpen && (
	<div
		style={{
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0,0,0,0.5)',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: 1000,
		}}
	>
		<div
			style={{
				backgroundColor: 'white',
				padding: '30px',
				borderRadius: '8px',
				width: '500px',
				textAlign: 'left',
				position: 'relative',
			}}
		>
			{/* X 버튼 */}
			<button
				onClick={() => {
					setIsModalOpen(false);
					setNewRoomName('');
					setInviteUser('');
					setInvitedUsers([]);
				}}
				style={{
					position: 'absolute',
					top: '10px',
					right: '10px',
					background: 'none',
					border: 'none',
					fontSize: '20px',
					cursor: 'pointer',
				}}
			>
				×
			</button>

			{/* 제목 */}
			<h2 style={{ marginBottom: '10px' }}>채팅방 설정</h2>
			<hr style={{ marginBottom: '20px' }} />

			{/* 방 이름 */}
			<label style={{ display: 'block', marginBottom: '5px' }}>방 이름</label>
			<input
				type="text"
				value={newRoomName}
				onChange={(e) => setNewRoomName(e.target.value)}
				style={{
					width: '100%',
					padding: '10px',
					marginBottom: '20px',
					borderRadius: '10px',
					border: '1px solid #ccc',
					backgroundColor: '#f5f5f5',
				}}
			/>

			{/* 초대할 유저 이름 + 버튼 */}
			<label style={{ display: 'block', marginBottom: '5px' }}>초대할 유저 이름</label>
			<div style={{ display: 'flex', marginBottom: '20px' }}>
				<input
					type="text"
					value={inviteUser}
					onChange={(e) => setInviteUser(e.target.value)}
					style={{
						flex: 1,
						padding: '10px',
						borderRadius: '10px',
						border: '1px solid #ccc',
						backgroundColor: '#f5f5f5',
					}}
				/>
				<button
					onClick={() => {
						if (inviteUser.trim()) {
							setInvitedUsers((prev) => [...prev, inviteUser.trim()]);
							setInviteUser('');
						}
					}}
					style={{
						marginLeft: '10px',
						padding: '0 10px',
						background: 'none',
						border: 'none',
						fontSize: '20px',
						cursor: 'pointer',
					}}
				>
					👤+
				</button>
			</div>

			{/* 초대한 유저 목록 */}
			<label style={{ display: 'block', marginBottom: '5px' }}>초대한 유저</label>
			<div
				style={{
					minHeight: '100px',
					border: '1px solid #ccc',
					borderRadius: '10px',
					padding: '10px',
					backgroundColor: '#f5f5f5',
					overflowY: 'auto',
				}}
			>
				{invitedUsers.length > 0 ? (
					invitedUsers.map((user, index) => (
						<div
							key={index}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '5px 0',
								borderBottom: index < invitedUsers.length - 1 ? '1px solid #ddd' : 'none',
							}}
						>
							<span>{user}</span>
							<div style={{ display: 'flex', gap: '8px' }}>
								<span style={{ color: 'green', cursor: 'default' }}>👤</span>
								<button
									onClick={() =>
										setInvitedUsers((prev) => prev.filter((_, i) => i !== index))
									}
									style={{
										background: 'none',
										border: 'none',
										color: 'red',
										cursor: 'pointer',
									}}
								>
									❌
								</button>
							</div>
						</div>
					))
				) : (
					<span style={{ color: '#aaa' }}>아직 초대한 유저가 없습니다.</span>
				)}
			</div>

			{/* 적용하기 버튼 */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
				<button
					onClick={addChatRoom}
					style={{
						padding: '10px 30px',
						border: 'none',
						backgroundColor: '#00BFFF',
						color: 'white',
						borderRadius: '20px',
						fontSize: '16px',
						cursor: 'pointer',
					}}
				>
					적용하기
				</button>
			</div>
		</div>
	</div>
)}

			</div>
		</div>
	)
}
