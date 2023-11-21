import React, { createContext, useMemo, useState } from "react";
import { io } from "socket.io-client";

export const UserContext = createContext({});
export const CallContext = createContext({});

function UserContextProvider({ children }) {
	const [username, setUsername] = useState("");
	const [id, setId] = useState(null);

	const socket = useMemo(
		() => io(`${import.meta.env.VITE_REACT_APP_WS_URL}`),
		[]
	);

	const providedUserValue = {
		username,
		setUsername,
		id,
		setId,
		socket,
	};

	const [audioCall, setAudioCall] = useState(false);
	const [videoCall, setVideoCall] = useState(false);
	const [remoteSocketId, setRemoteSocketId] = useState(null);

	const providedCallValue = {
		audioCall,
		setAudioCall,
		videoCall,
		setVideoCall,
		remoteSocketId,
		setRemoteSocketId,
	};

	return (
		<UserContext.Provider value={providedUserValue}>
			<CallContext.Provider value={providedCallValue}>
				{children}
			</CallContext.Provider>
		</UserContext.Provider>
	);
}

export default UserContextProvider;
