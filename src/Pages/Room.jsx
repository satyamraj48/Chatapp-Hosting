import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import ReactPlayer from "react-player";

function Room() {
	const { socket, peer, getOffer, getAnswer, setRemoteAnswer } =
		useContext(UserContext);

	const [remoteSocketId, setRemoteSocketId] = useState(null);
	const [myStream, setMyStream] = useState(null);
	const [remoteStream, setRemoteStream] = useState(null);

	async function handleNewUserJoined({ emailId, id }) {
		console.log("new user joined room", emailId, "s id-> ", id);
		setRemoteSocketId(id);
	}

	async function handleIncomingCall({ from, offer }) {
		console.log("Incoming Call from ->", from, " and offer is -> ", offer);
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});
		setMyStream(stream);
		setRemoteSocketId(from);
		const ans = await getAnswer(offer);
		socket.emit("call:accepted", { to: from, ans });
	}

	async function handleCallAccepted({ from, ans }) {
		console.log("Call Accepted -> ", from, "and answer->", ans);
		await setRemoteAnswer(ans);
		sendStreams();
	}

	const handleTrackEvent = async (ev) => {
		const remoteStream = ev.streams;
		console.log("GOT TRACKS!!");
		setRemoteStream(remoteStream[0]);
	};

	useEffect(() => {
		peer.addEventListener("track", handleTrackEvent);
		return () => {
			peer.removeEventListener("track", handleTrackEvent);
		};
	}, [handleTrackEvent, peer]);

	async function handleNegotiationIncoming({ from, offer }) {
		const ans = await getAnswer(offer);
		socket.emit("peer:nego:done", { to: from, ans });
	}

	async function handleNegotiationFinal({ from, ans }) {
		console.log("Negotiation Final");
		await setRemoteAnswer(ans);
	}

	useEffect(() => {
		socket.on("user:joined", handleNewUserJoined);
		socket.on("incoming:call", handleIncomingCall);
		socket.on("call:accepted", handleCallAccepted);
		socket.on("peer:nego:needed", handleNegotiationIncoming);
		socket.on("peer:nego:final", handleNegotiationFinal);

		return () => {
			socket.off("user:joined", handleNewUserJoined);
			socket.off("incoming:call", handleIncomingCall);
			socket.off("call:accepted", handleCallAccepted);
			socket.off("peer:nego:needed", handleNegotiationIncoming);
			socket.off("peer:nego:final", handleNegotiationFinal);
		};
	}, [
		handleNegotiationFinal,
		handleNegotiationIncoming,
		handleCallAccepted,
		handleIncomingCall,
		handleNewUserJoined,
		socket,
	]);

	async function handleNegotiation() {
		console.log("Negotiation needed!");
		const offer = await getOffer();
		socket.emit("peer:nego:needed", {
			to: remoteSocketId,
			offer,
		});
	}

	useEffect(() => {
		peer.addEventListener("negotiationneeded", handleNegotiation);
		return () => {
			peer.removeEventListener("negotiationneeded", handleNegotiation);
		};
	}, [handleNegotiation, peer]);

	//button click
	const handleCallUser = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});
		const offer = await getOffer();
		socket.emit("user:call", { to: remoteSocketId, offer });
		setMyStream(stream);
	};

	const sendStreams = () => {
		for (const track of myStream.getTracks()) {
			peer.addTrack(track, myStream);
		}
	};

	return (
		<div className="w-screen h-screen flex flex-col items-center">
			{/* <h1 className="text-3xl font-semibold">Room Page</h1> */}
			<h4 className="mt-2 text-lg">
			{remoteSocketId ? "Connected" : "Not Connected"}
			</h4>

			<div className="bg-pink-300 h- flex flex-col items-center justify-evenly gap-5">
				<div className="">
					{myStream && (
						<>
							{/* <p>My Stream</p> */}
							<ReactPlayer
								width={"100%"}
								height={"100%"}
								url={myStream}
								playing
								muted
							/>
						</>
					)}
				</div>
				<div className="">
					{remoteStream && (
						<>
							{/* <p>Remote Stream</p> */}
							<ReactPlayer
								width={"100%"}
								height={"100%"}
								url={remoteStream}
								playing
							/>
						</>
					)}
				</div>
			</div>
			<div className="mt-10 w-full flex items-center justify-center gap-10">
				{myStream && (
					<button
						className="bg-gray-700 text-white rounded-md p-2"
						onClick={sendStreams}
					>
						Send Video
					</button>
				)}
				{remoteSocketId && (
					<button
						className="bg-green-500 rounded-lg p-2"
						onClick={handleCallUser}
					>
						CALL
					</button>
				)}
			</div>
			{/* <button className="mt-2 bg-red-500 rounded-lg p-2">Cancel</button> */}
		</div>
	);
}

export default Room;
