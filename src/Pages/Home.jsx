import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router-dom";

function Home({ roomId, emailId }) {
	const { socket } = useContext(UserContext);

	// const [roomId, setRoomId] = useState("");
	// const [emailId, setEmailId] = useState("");
	const navigate = useNavigate();

	function handleJoinRoom({ roomId, emailId }) {
		navigate(`/room/${roomId}`);
	}

	useEffect(() => {
		if (roomId && emailId) {
			socket.emit("room:join", { roomId, emailId });
		}
	}, [roomId, emailId]);

	useEffect(() => {
		socket.on("room:join", handleJoinRoom);
		return () => {
			socket.off("room:join", handleJoinRoom);
		};
	}, [handleJoinRoom, socket]);

	return (
		<div className="h-[calc(100vh-4rem)] flex items-center justify-center">
			<div className="bg-pink-400 text-gray-700 text-3xl flex flex-col items-center gap-2">
				Calling...
			</div>
		</div>
	);
}

export default Home;
