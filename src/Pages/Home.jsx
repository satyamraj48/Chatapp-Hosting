import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router-dom";

function Home() {
	const { socket } = useContext(UserContext);
	// console.log(socket);

	const [roomId, setRoomId] = useState("");
	const [emailId, setEmailId] = useState("");
	const navigate = useNavigate();

	function handleSubmit(e) {
		e.preventDefault();
		// if (roomId && emailId) {
		// 	socket.emit("room:join", { roomId, emailId });
		// }
	}

	function handleJoinRoom({ roomId, emailId }) {
		navigate(`/room/${roomId}`);
	}

	useEffect(() => {
		socket.on("room:join", handleJoinRoom);
		return () => {
			socket.off("room:join", handleJoinRoom);
		};
	}, [handleJoinRoom, socket]);

	return (
		<div className="h-[calc(100vh-4rem)] flex items-center justify-center">
			<div className="flex flex-col items-center gap-2">
				<form onSubmit={handleSubmit} className="space-y-3">
					<label htmlFor="email">Email ID: </label>
					<input
						type="email"
						id="email"
						value={emailId}
						onChange={(e) => setEmailId(e.target.value)}
						placeholder="Enter your email here"
						className="border-2 px-2 rounded-sm placeholder:text-sm text-sm"
					/>
					<br />
					<label htmlFor="room">Room ID: </label>
					<input
						type="text"
						id="room"
						value={roomId}
						onChange={(e) => setRoomId(e.target.value)}
						placeholder="Enter Room Code"
						className="border-2 px-2 rounded-sm placeholder:text-sm text-sm"
					/>
					<br />
					<button className="px-2 py-1 w-full bg-yellow-300 rounded-sm text-sm font-semibold active:scale-95">
						Join
					</button>
				</form>
			</div>
		</div>
	);
}

export default Home;
