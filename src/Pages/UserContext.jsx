import React, { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

export const UserContext = createContext({});

function UserContextProvider({ children }) {
	const [username, setUsername] = useState(null);
	const [id, setId] = useState(null);

	const socket = useMemo(() => io(`${import.meta.env.VITE_REACT_APP_VIDEO_URL}`), []);

	const peer = useMemo(
		() =>
			new RTCPeerConnection({
				iceServers: [
					{
						urls: [
							"stun:stun.l.google.com:19302",
							"stun:global.stun.twilio.com:3478",
						],
					},
				],
			}),
		[]
	);

	const getOffer = async () => {
		if (peer) {
			const offer = await peer.createOffer();
			await peer.setLocalDescription(new RTCSessionDescription(offer));
			return offer;
		}
	};

	const getAnswer = async (offer) => {
		if (peer) {
			await peer.setRemoteDescription(offer);
			const answer = await peer.createAnswer();
			await peer.setLocalDescription(new RTCSessionDescription(answer));
			return answer;
		}
	};

	const setRemoteAnswer = async (ans) => {
		if (peer) {
			await peer.setRemoteDescription(new RTCSessionDescription(ans));
		}
	};

	const sendStream = async (stream) => {
		const tracks = stream.getTracks();
		for (const track of tracks) {
			peer.addTrack(track, stream);
		}
	};

	const [remoteStream, setRemoteStream] = useState(null);

	function handleTrackEvent(ev) {
		const streams = ev.streams;
		setRemoteStream(streams[0]);
	}

	useEffect(() => {
		peer.addEventListener("track", handleTrackEvent);
		return () => {
			peer.removeEventListener("track", handleTrackEvent);
		};
	}, [handleTrackEvent, peer]);

	const providedValue = {
		username,
		setUsername,
		id,
		setId,
		socket,
		peer,
		getOffer,
		getAnswer,
		setRemoteAnswer,
		sendStream,
		remoteStream,
	};

	return (
		<UserContext.Provider value={providedValue}>
			{children}
		</UserContext.Provider>
	);
}

export default UserContextProvider;
